import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  AdminEmployerVerificationDecision,
  AdminEmployerVerificationDecisionResponse,
  AdminEmployerVerificationDetailResponse,
  AdminEmployerDocumentReview,
  AdminEmployerDocumentReviewResponse,
  AdminEmployerVerificationListResponse,
  AdminEmployerVerificationQuery,
} from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';
import { AdminRecordNotFoundError, AdminStateConflictError } from '@/modules/admin/admin-errors.js';
import { EmployerVerificationRepository } from './employer-verification.repository.js';

@Injectable()
export class PrismaEmployerVerificationRepository implements EmployerVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminEmployerVerificationQuery,
  ): Promise<AdminEmployerVerificationListResponse> {
    const where: Prisma.EmployerProfileWhereInput = query.status
      ? { verificationStatus: query.status }
      : {};
    const [records, total] = await Promise.all([
      this.prisma.client.employerProfile.findMany({
        where,
        orderBy: [{ verificationSubmittedAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          businessName: true,
          employerType: true,
          verificationStatus: true,
          verificationSubmittedAt: true,
          _count: { select: { documents: { where: { reviewStatus: 'PENDING' } } } },
          user: { select: { id: true, name: true, email: true } },
        } satisfies Prisma.EmployerProfileSelect,
      }),
      this.prisma.client.employerProfile.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        businessName: record.businessName,
        employerType: record.employerType,
        verificationStatus: record.verificationStatus,
        verificationSubmittedAt: record.verificationSubmittedAt?.toISOString() ?? null,
        pendingDocuments: record._count.documents,
        user: record.user,
      })),
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }

  async findById(id: string): Promise<AdminEmployerVerificationDetailResponse | null> {
    const record = await this.prisma.client.employerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        businessName: true,
        employerType: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        verificationLevel: true,
        contactPersonName: true,
        businessDescription: true,
        businessPhone: true,
        websiteUrl: true,
        addressLine: true,
        cityName: true,
        districtName: true,
        stateName: true,
        postalCode: true,
        verificationNote: true,
        rejectionReason: true,
        _count: { select: { documents: { where: { reviewStatus: 'PENDING' } } } },
        user: { select: { id: true, name: true, email: true } },
        documents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            documentType: true,
            originalName: true,
            mimeType: true,
            fileSizeBytes: true,
            documentNumber: true,
            issuedAt: true,
            expiresAt: true,
            reviewStatus: true,
            reviewNote: true,
          },
        },
      },
    });
    if (!record) return null;

    const { _count, documents, ...verification } = record;
    return {
      ...verification,
      verificationSubmittedAt: verification.verificationSubmittedAt?.toISOString() ?? null,
      pendingDocuments: _count.documents,
      documents: documents.map((document) => ({
        ...document,
        fileSizeBytes: document.fileSizeBytes?.toString() ?? null,
        issuedAt: document.issuedAt?.toISOString() ?? null,
        expiresAt: document.expiresAt?.toISOString() ?? null,
      })),
    };
  }

  async review(
    id: string,
    input: AdminEmployerVerificationDecision,
    context: AdminActionContext,
  ): Promise<AdminEmployerVerificationDecisionResponse> {
    const now = new Date();
    return this.prisma.client.$transaction(async (tx) => {
      const current = await tx.employerProfile.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          verificationStatus: true,
          verificationNote: true,
        },
      });
      if (!current) throw new AdminRecordNotFoundError();

      const reviewableStatuses = ['PENDING', 'UNDER_REVIEW', 'NEEDS_MORE_INFO'] as const;
      if (!reviewableStatuses.some((status) => status === current.verificationStatus)) {
        throw new AdminStateConflictError();
      }

      const statusByDecision = {
        UNDER_REVIEW: 'UNDER_REVIEW',
        APPROVE: 'VERIFIED',
        REJECT: 'REJECTED',
        NEEDS_MORE_INFO: 'NEEDS_MORE_INFO',
      } as const;
      const status = statusByDecision[input.decision];
      const note =
        input.note ?? (input.decision === 'UNDER_REVIEW' ? current.verificationNote : null);
      if (input.decision === 'APPROVE') {
        const pendingDocuments = await tx.employerDocument.count({
          where: { employerId: id, reviewStatus: 'PENDING' },
        });
        if (pendingDocuments > 0) throw new AdminStateConflictError();
      }
      const updated = await tx.employerProfile.updateMany({
        where: {
          id,
          verificationStatus: current.verificationStatus,
          ...(input.decision === 'APPROVE'
            ? { documents: { none: { reviewStatus: 'PENDING' } } }
            : {}),
        },
        data: {
          verificationStatus: status,
          verificationNote: note,
          rejectionReason: input.decision === 'REJECT' ? note : null,
          verifiedAt: input.decision === 'APPROVE' ? now : null,
          verifiedById: context.actorId,
        },
      });
      if (updated.count !== 1) throw new AdminStateConflictError();

      await tx.auditLog.create({
        data: {
          actorId: context.actorId,
          action: `EMPLOYER_VERIFICATION_${input.decision}`,
          entityType: 'EMPLOYER_VERIFICATION',
          entityId: id,
          metadata: { decision: input.decision, note },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });

      if (input.decision !== 'UNDER_REVIEW') {
        const notification = {
          APPROVE: {
            type: 'EMPLOYER_VERIFICATION_APPROVED',
            title: 'Employer verification approved',
            body: 'Your employer verification has been approved.',
          },
          REJECT: {
            type: 'EMPLOYER_VERIFICATION_REJECTED',
            title: 'Employer verification rejected',
            body: `Your employer verification was rejected. ${note ?? ''}`,
          },
          NEEDS_MORE_INFO: {
            type: 'EMPLOYER_VERIFICATION_NEEDS_INFO',
            title: 'More verification information required',
            body: `Please provide more information for your employer verification. ${note ?? ''}`,
          },
        } satisfies Record<
          'APPROVE' | 'REJECT' | 'NEEDS_MORE_INFO',
          Pick<Prisma.NotificationCreateInput, 'type' | 'title' | 'body'>
        >;
        const notificationForDecision = notification[input.decision];
        await tx.notification.create({
          data: {
            userId: current.userId,
            ...notificationForDecision,
            resourceType: 'EMPLOYER_VERIFICATION',
            resourceId: id,
            data: { status },
          },
        });
      }

      return {
        id,
        verificationStatus: status,
        verificationNote: note,
        rejectionReason: input.decision === 'REJECT' ? note : null,
      };
    });
  }

  async recordDocumentAccess(
    employerId: string,
    documentId: string,
    context: AdminActionContext,
  ): Promise<{ assetId: string }> {
    return this.prisma.client.$transaction(async (tx) => {
      const document = await tx.employerDocument.findFirst({
        where: {
          id: documentId,
          employerId,
          employer: { verificationSubmittedAt: { not: null } },
        },
        select: { storageAssetId: true },
      });
      if (!document) throw new AdminRecordNotFoundError();
      if (!document.storageAssetId) {
        throw new ServiceUnavailableException(
          'This document requires a private storage review before it can be accessed.',
        );
      }
      await tx.auditLog.create({
        data: {
          actorId: context.actorId,
          action: 'EMPLOYER_DOCUMENT_ACCESS_REQUESTED',
          entityType: 'EMPLOYER_DOCUMENT',
          entityId: documentId,
          metadata: { employerId },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
      return { assetId: document.storageAssetId };
    });
  }

  async reviewDocument(
    employerId: string,
    documentId: string,
    input: AdminEmployerDocumentReview,
    context: AdminActionContext,
  ): Promise<AdminEmployerDocumentReviewResponse> {
    const now = new Date();
    return this.prisma.client.$transaction(async (tx) => {
      const document = await tx.employerDocument.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          employerId: true,
          reviewStatus: true,
          employer: { select: { verificationStatus: true } },
        },
      });
      if (!document || document.employerId !== employerId) {
        throw new AdminRecordNotFoundError();
      }
      if (
        !['PENDING', 'UNDER_REVIEW', 'NEEDS_MORE_INFO'].includes(
          document.employer.verificationStatus,
        )
      ) {
        throw new AdminStateConflictError();
      }
      if (document.reviewStatus !== 'PENDING') throw new AdminStateConflictError();

      const reviewStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const updated = await tx.employerDocument.updateMany({
        where: { id: documentId, employerId, reviewStatus: 'PENDING' },
        data: {
          reviewStatus,
          reviewNote: input.note ?? null,
          reviewedById: context.actorId,
          reviewedAt: now,
        },
      });
      if (updated.count !== 1) throw new AdminStateConflictError();

      await tx.auditLog.create({
        data: {
          actorId: context.actorId,
          action: `EMPLOYER_DOCUMENT_${input.decision}`,
          entityType: 'EMPLOYER_DOCUMENT',
          entityId: documentId,
          metadata: { employerId, reviewStatus, note: input.note ?? null },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });

      return {
        id: documentId,
        reviewStatus,
        reviewNote: input.note ?? null,
        reviewedAt: now.toISOString(),
      };
    });
  }
}
