import { Injectable } from '@nestjs/common';
import type {
  AdminJobDetailResponse,
  AdminJobListResponse,
  AdminJobModerationDecision,
  AdminJobModerationDecisionResponse,
  AdminJobModerationQuery,
} from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';
import { AdminRecordNotFoundError, AdminStateConflictError } from '@/modules/admin/admin-errors.js';
import { JobModerationRepository } from './job-moderation.repository.js';

@Injectable()
export class PrismaJobModerationRepository implements JobModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminJobModerationQuery): Promise<AdminJobListResponse> {
    const where: Prisma.JobWhereInput = query.status ? { status: query.status } : {};
    const [records, total] = await Promise.all([
      this.prisma.client.job.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          title: true,
          status: true,
          employmentType: true,
          cityName: true,
          stateName: true,
          createdAt: true,
          employer: {
            select: {
              id: true,
              businessName: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      this.prisma.client.job.count({ where }),
    ]);

    return {
      items: records.map((record) => ({ ...record, createdAt: record.createdAt.toISOString() })),
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }

  async findById(id: string): Promise<AdminJobDetailResponse | null> {
    const job = await this.prisma.client.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        employmentType: true,
        cityName: true,
        stateName: true,
        createdAt: true,
        description: true,
        responsibilities: true,
        workMode: true,
        experienceLevel: true,
        salaryMin: true,
        salaryMax: true,
        salaryPeriod: true,
        salaryCurrency: true,
        openings: true,
        addressLine: true,
        districtName: true,
        moderationNote: true,
        publishedAt: true,
        employer: {
          select: {
            id: true,
            businessName: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!job) return null;

    return {
      ...job,
      createdAt: job.createdAt.toISOString(),
      publishedAt: job.publishedAt?.toISOString() ?? null,
      salaryMin: job.salaryMin?.toString() ?? null,
      salaryMax: job.salaryMax?.toString() ?? null,
    };
  }

  async moderate(
    id: string,
    input: AdminJobModerationDecision,
    context: AdminActionContext,
  ): Promise<AdminJobModerationDecisionResponse> {
    const now = new Date();
    return this.prisma.client.$transaction(async (tx) => {
      const current = await tx.job.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          status: true,
          expiresAt: true,
          employer: { select: { id: true, userId: true } },
        },
      });
      if (!current) throw new AdminRecordNotFoundError();

      const allowedStatuses: Record<AdminJobModerationDecision['decision'], string[]> = {
        APPROVE: ['PENDING_REVIEW'],
        REJECT: ['PENDING_REVIEW'],
        HIDE: ['PUBLISHED'],
        RESTORE: ['HIDDEN'],
        REMOVE: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'HIDDEN'],
      };
      if (!allowedStatuses[input.decision].includes(current.status)) {
        throw new AdminStateConflictError();
      }

      if (input.decision === 'APPROVE' || input.decision === 'RESTORE') {
        await tx.$queryRaw`SELECT "id" FROM "employer_profiles" WHERE "id" = ${current.employer.id}::uuid FOR UPDATE`;
        const employer = await tx.employerProfile.findUnique({
          where: { id: current.employer.id },
          select: { verificationStatus: true, completedAt: true },
        });
        if (
          !employer?.completedAt ||
          employer.verificationStatus !== 'VERIFIED' ||
          (current.expiresAt && current.expiresAt <= now)
        ) {
          throw new AdminStateConflictError();
        }
      }

      const statusByDecision = {
        APPROVE: 'PUBLISHED',
        REJECT: 'REJECTED',
        HIDE: 'HIDDEN',
        RESTORE: 'PUBLISHED',
        REMOVE: 'REMOVED',
      } as const;
      const status = statusByDecision[input.decision];
      const updated = await tx.job.updateMany({
        where: { id, status: current.status },
        data: {
          status,
          moderationNote: input.reason,
          moderatedById: context.actorId,
          moderatedAt: now,
          ...(input.decision === 'APPROVE' ? { publishedAt: now } : {}),
        },
      });
      if (updated.count !== 1) throw new AdminStateConflictError();

      await tx.auditLog.create({
        data: {
          actorId: context.actorId,
          action: `JOB_${input.decision}`,
          entityType: 'JOB',
          entityId: id,
          metadata: { fromStatus: current.status, status, reason: input.reason },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });

      const notification = {
        APPROVE: {
          type: 'JOB_APPROVED',
          title: 'Job listing approved',
          body: `Your job listing "${current.title}" has been approved.`,
        },
        REJECT: {
          type: 'JOB_REJECTED',
          title: 'Job listing rejected',
          body: `Your job listing "${current.title}" was rejected. ${input.reason}`,
        },
        HIDE: {
          type: 'JOB_PAUSED',
          title: 'Job listing hidden',
          body: `Your job listing "${current.title}" was hidden by an administrator. ${input.reason}`,
        },
        RESTORE: {
          type: 'SYSTEM',
          title: 'Job listing restored',
          body: `Your job listing "${current.title}" was restored by an administrator.`,
        },
        REMOVE: {
          type: 'JOB_REMOVED',
          title: 'Job listing removed',
          body: `Your job listing "${current.title}" was removed. ${input.reason}`,
        },
      } satisfies Record<
        AdminJobModerationDecision['decision'],
        Pick<Prisma.NotificationCreateInput, 'type' | 'title' | 'body'>
      >;
      await tx.notification.create({
        data: {
          userId: current.employer.userId,
          ...notification[input.decision],
          resourceType: 'JOB',
          resourceId: id,
          data: { status },
        },
      });

      return { id, status, moderationNote: input.reason, moderatedAt: now.toISOString() };
    });
  }
}
