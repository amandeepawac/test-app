import { Injectable } from '@nestjs/common';
import type {
  AdminReportDetailResponse,
  AdminReportListResponse,
  AdminReportQuery,
  AdminReportUpdate,
  AdminReportUpdateResponse,
} from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';
import { AdminRecordNotFoundError, AdminStateConflictError } from '@/modules/admin/admin-errors.js';
import { ReportReviewRepository } from './report-review.repository.js';

@Injectable()
export class PrismaReportReviewRepository implements ReportReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminReportQuery): Promise<AdminReportListResponse> {
    const where = {
      status: query.status ? query.status : { in: ['OPEN', 'UNDER_REVIEW'] as const },
    };
    const [records, total] = await Promise.all([
      this.prisma.client.report.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          reporter: { select: { id: true, name: true, email: true } },
          targetJob: { select: { id: true, title: true, status: true } },
          targetEmployer: { select: { id: true, businessName: true } },
          targetUser: { select: { id: true, name: true, email: true, status: true } },
        },
      }),
      this.prisma.client.report.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        reason: record.reason,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        reporter: record.reporter,
        target: {
          job: record.targetJob,
          employer: record.targetEmployer,
          user: record.targetUser,
        },
      })),
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }

  async findById(id: string): Promise<AdminReportDetailResponse | null> {
    const report = await this.prisma.client.report.findUnique({
      where: { id },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        description: true,
        reviewNote: true,
        reviewedAt: true,
        reporter: { select: { id: true, name: true, email: true } },
        targetJob: { select: { id: true, title: true, status: true } },
        targetEmployer: { select: { id: true, businessName: true } },
        targetUser: { select: { id: true, name: true, email: true, status: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!report) return null;

    return {
      id: report.id,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      description: report.description,
      reviewNote: report.reviewNote,
      reviewedAt: report.reviewedAt?.toISOString() ?? null,
      reporter: report.reporter,
      target: {
        job: report.targetJob,
        employer: report.targetEmployer,
        user: report.targetUser,
      },
      reviewedBy: report.reviewedBy,
    };
  }

  async update(
    id: string,
    input: AdminReportUpdate,
    context: AdminActionContext,
  ): Promise<AdminReportUpdateResponse> {
    const now = new Date();
    return this.prisma.client.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id },
        select: { id: true, reporterId: true, status: true },
      });
      if (!current) throw new AdminRecordNotFoundError();

      const allowedTransitions = {
        OPEN: ['UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'CLOSED'],
        UNDER_REVIEW: ['OPEN', 'ACTION_TAKEN', 'DISMISSED', 'CLOSED'],
        ACTION_TAKEN: ['UNDER_REVIEW', 'CLOSED'],
        DISMISSED: ['UNDER_REVIEW', 'CLOSED'],
        CLOSED: [],
      } as const;
      if (!allowedTransitions[current.status].some((status) => status === input.status)) {
        throw new AdminStateConflictError();
      }

      const updated = await tx.report.updateMany({
        where: { id, status: current.status },
        data: {
          status: input.status,
          reviewNote: input.reviewNote,
          reviewedById: context.actorId,
          reviewedAt: now,
        },
      });
      if (updated.count !== 1) throw new AdminStateConflictError();

      await tx.auditLog.create({
        data: {
          actorId: context.actorId,
          action: `REPORT_${input.status}`,
          entityType: 'REPORT',
          entityId: id,
          metadata: { fromStatus: current.status, status: input.status, note: input.reviewNote },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });

      if (['ACTION_TAKEN', 'DISMISSED', 'CLOSED'].includes(input.status)) {
        await tx.notification.create({
          data: {
            userId: current.reporterId,
            type: 'SYSTEM',
            title: 'Your report has been reviewed',
            body: 'An administrator has completed the review of your report.',
            resourceType: 'REPORT',
            resourceId: id,
            data: { status: input.status },
          },
        });
      }

      return {
        id,
        status: input.status,
        reviewNote: input.reviewNote,
        reviewedAt: now.toISOString(),
      };
    });
  }
}
