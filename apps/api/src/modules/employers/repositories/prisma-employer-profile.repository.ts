import { Injectable } from '@nestjs/common';
import type {
  EmployerProfileResponse,
  EmployerProfileUpdate,
  EmployerVerificationDocumentResponse,
  EmployerVerificationDocumentUpload,
} from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  EmployerIdentityChangeConflictError,
  EmployerProfileIncompleteError,
  EmployerProfileNotFoundError,
  EmployerVerificationDocumentConflictError,
  EmployerVerificationDocumentNotFoundError,
  EmployerVerificationSubmissionError,
} from '@/modules/employers/employer-errors.js';
import { PrivateDocumentStorage } from '@/infrastructure/storage/private-document-storage.js';
import { EmployerProfileRepository } from './employer-profile.repository.js';

const profileSelect = {
  id: true,
  businessName: true,
  employerType: true,
  contactPersonName: true,
  businessPhone: true,
  stateName: true,
  cityName: true,
  businessDescription: true,
  addressLine: true,
  websiteUrl: true,
  showEmail: true,
  showPhone: true,
  completedAt: true,
  verificationStatus: true,
  verificationLevel: true,
  verificationSubmittedAt: true,
  verifiedAt: true,
  rejectionReason: true,
  verificationNote: true,
  user: { select: { email: true } },
} satisfies Prisma.EmployerProfileSelect;

type ProfileRecord = Prisma.EmployerProfileGetPayload<{ select: typeof profileSelect }>;

function toResponse(profile: ProfileRecord): EmployerProfileResponse {
  return {
    id: profile.id,
    businessName: profile.businessName,
    employerType: profile.employerType,
    contactPersonName: profile.contactPersonName,
    businessPhone: profile.businessPhone,
    email: profile.user.email,
    stateName: profile.stateName,
    cityName: profile.cityName,
    businessDescription: profile.businessDescription,
    addressLine: profile.addressLine,
    websiteUrl: profile.websiteUrl,
    showEmail: profile.showEmail,
    showPhone: profile.showPhone,
    completedAt: profile.completedAt?.toISOString() ?? null,
    verification: {
      verificationStatus: profile.verificationStatus,
      verificationLevel: profile.verificationLevel,
      verificationSubmittedAt: profile.verificationSubmittedAt?.toISOString() ?? null,
      verifiedAt: profile.verifiedAt?.toISOString() ?? null,
      rejectionReason: profile.rejectionReason,
      verificationNote: profile.verificationNote,
    },
  };
}

@Injectable()
export class PrismaEmployerProfileRepository implements EmployerProfileRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentStorage: PrivateDocumentStorage,
  ) {}

  async findByUserId(userId: string): Promise<EmployerProfileResponse | null> {
    const profile = await this.prisma.client.employerProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    return profile ? toResponse(profile) : null;
  }

  async save(userId: string, input: EmployerProfileUpdate): Promise<EmployerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "employer_profiles" WHERE "userId" = ${userId}::uuid FOR UPDATE`;
      const current = await tx.employerProfile.findUnique({
        where: { userId },
        select: { businessName: true, employerType: true, verificationStatus: true },
      });
      if (
        current &&
        current.verificationStatus !== 'NOT_SUBMITTED' &&
        ((input.businessName !== undefined && input.businessName !== current.businessName) ||
          (input.employerType !== undefined && input.employerType !== current.employerType))
      ) {
        throw new EmployerIdentityChangeConflictError();
      }

      const profile = await tx.employerProfile.upsert({
        where: { userId },
        create: { userId, ...input },
        update: input,
        select: profileSelect,
      });
      return toResponse(profile);
    });
  }

  async complete(userId: string): Promise<EmployerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "employer_profiles" WHERE "userId" = ${userId}::uuid FOR UPDATE`;
      const profile = await tx.employerProfile.findUnique({
        where: { userId },
        select: profileSelect,
      });
      if (!profile) throw new EmployerProfileNotFoundError();
      if (
        !profile.businessName?.trim() ||
        !profile.employerType ||
        !profile.contactPersonName?.trim() ||
        !profile.businessPhone?.trim() ||
        !profile.stateName?.trim() ||
        !profile.cityName?.trim()
      ) {
        throw new EmployerProfileIncompleteError();
      }
      if (profile.completedAt) return toResponse(profile);

      const completed = await tx.employerProfile.update({
        where: { userId },
        data: { completedAt: new Date() },
        select: profileSelect,
      });
      return toResponse(completed);
    });
  }

  async listDocuments(
    userId: string,
  ): Promise<EmployerVerificationDocumentResponse[]> {
    const profile = await this.prisma.client.employerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new EmployerProfileNotFoundError();
    const documents = await this.prisma.client.employerDocument.findMany({
      where: { employerId: profile.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        documentType: true,
        originalName: true,
        mimeType: true,
        fileSizeBytes: true,
        reviewStatus: true,
        reviewNote: true,
        createdAt: true,
      },
    });
    return documents.map((document) => ({
      ...document,
      fileSizeBytes: document.fileSizeBytes?.toString() ?? null,
      createdAt: document.createdAt.toISOString(),
    }));
  }

  async uploadDocument(
    userId: string,
    input: EmployerVerificationDocumentUpload,
  ): Promise<EmployerVerificationDocumentResponse> {
    if (!/^([A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.base64Data)) {
      throw new EmployerVerificationSubmissionError('A valid Base64 document payload is required');
    }
    const bytes = Buffer.from(input.base64Data, 'base64');
    if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) {
      throw new EmployerVerificationSubmissionError('The document must be non-empty and no larger than 5 MB');
    }

    const profile = await this.prisma.client.employerProfile.findUnique({
      where: { userId },
      select: { id: true, completedAt: true, verificationStatus: true },
    });
    if (!profile) throw new EmployerProfileNotFoundError();
    if (!profile.completedAt) throw new EmployerProfileIncompleteError();
    if (
      ![
        'NOT_SUBMITTED',
        'REJECTED',
        'NEEDS_MORE_INFO',
        'PENDING',
        'UNDER_REVIEW',
      ].includes(profile.verificationStatus)
    ) {
      throw new EmployerVerificationDocumentConflictError(
        'Documents cannot be changed while verification is in this state',
      );
    }
    const documentCount = await this.prisma.client.employerDocument.count({
      where: { employerId: profile.id },
    });
    if (documentCount >= 10) {
      throw new EmployerVerificationDocumentConflictError(
        'No more than 10 verification documents can be submitted',
      );
    }

    const uploaded = await this.documentStorage.upload({
      employerId: profile.id,
      originalName: input.originalName,
      mimeType: input.mimeType,
      base64Data: input.base64Data,
    });
    try {
      const document = await this.prisma.client.employerDocument.create({
        data: {
          employerId: profile.id,
          documentType: input.documentType,
          storageKey: uploaded.publicId,
          storageAssetId: uploaded.assetId,
          originalName: input.originalName,
          mimeType: input.mimeType,
          fileSizeBytes: BigInt(uploaded.bytes),
          reviewStatus: 'PENDING',
        },
        select: {
          id: true,
          documentType: true,
          originalName: true,
          mimeType: true,
          fileSizeBytes: true,
          reviewStatus: true,
          reviewNote: true,
          createdAt: true,
        },
      });
      return {
        ...document,
        fileSizeBytes: document.fileSizeBytes?.toString() ?? null,
        createdAt: document.createdAt.toISOString(),
      };
    } catch (error) {
      try {
        await this.documentStorage.delete(uploaded.publicId, input.mimeType, 'authenticated');
      } catch (cleanupError) {
        console.error('Verification document cleanup failed', uploaded.publicId, cleanupError);
        throw cleanupError;
      }
      throw error;
    }
  }

  async submit(userId: string): Promise<EmployerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      const profile = await tx.employerProfile.findUnique({
        where: { userId },
        select: {
          ...profileSelect,
          id: true,
        },
      });
      if (!profile) throw new EmployerProfileNotFoundError();
      if (!profile.completedAt) throw new EmployerProfileIncompleteError();
      if (!['NOT_SUBMITTED', 'REJECTED', 'NEEDS_MORE_INFO'].includes(profile.verificationStatus)) {
        throw new EmployerVerificationSubmissionError(
          'Verification can only be submitted or resubmitted in an eligible state',
        );
      }
      const documentCount = await tx.employerDocument.count({
        where: { employerId: profile.id, reviewStatus: 'PENDING' },
      });
      if (documentCount === 0) {
        throw new EmployerVerificationSubmissionError(
          'Upload at least one document before submitting verification',
        );
      }
      const now = new Date();
      const updated = await tx.employerProfile.update({
        where: { userId },
        data: {
          verificationStatus: 'PENDING',
          verificationSubmittedAt: now,
          rejectionReason: null,
          verificationNote: null,
          verifiedAt: null,
          verifiedById: null,
        },
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          entityType: 'EMPLOYER_VERIFICATION',
          entityId: profile.id,
          action: 'EMPLOYER_VERIFICATION_SUBMITTED',
          metadata: { documentCount },
        },
      });
      return toResponse(updated);
    });
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const profile = await this.prisma.client.employerProfile.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true },
    });
    if (!profile) throw new EmployerProfileNotFoundError();
    if (['VERIFIED', 'SUSPENDED'].includes(profile.verificationStatus)) {
      throw new EmployerVerificationDocumentConflictError(
        'Documents cannot be changed after verification is complete or suspended',
      );
    }
    const document = await this.prisma.client.employerDocument.findFirst({
      where: { id: documentId, employerId: profile.id },
      select: { id: true, storageKey: true, storageAssetId: true, mimeType: true },
    });
    if (!document) throw new EmployerVerificationDocumentNotFoundError();

    await this.documentStorage.delete(
      document.storageKey,
      document.mimeType ?? 'image/jpeg',
      document.storageAssetId ? 'authenticated' : 'upload',
    );
    await this.prisma.client.$transaction(async (tx) => {
      const deleted = await tx.employerDocument.deleteMany({
        where: { id: document.id, employerId: profile.id },
      });
      if (deleted.count !== 1) throw new EmployerVerificationDocumentNotFoundError();
      await tx.auditLog.create({
        data: {
          actorId: userId,
          entityType: 'EMPLOYER_DOCUMENT',
          entityId: document.id,
          action: 'EMPLOYER_DOCUMENT_DELETED_BY_OWNER',
          metadata: { employerId: profile.id },
        },
      });
    });
  }
}
