import { Injectable } from '@nestjs/common';
import type { SavedJobListResponse, SavedJobState, SavedJobsQuery } from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { publicJobEligibility } from '@/modules/employers/repositories/public-job-eligibility.js';
import { SavedJobUnavailableError } from '@/modules/job-seeker/job-seeker-errors.js';
import { SavedJobsRepository } from './saved-jobs.repository.js';

const savedJobSelect = {
  jobId: true,
  createdAt: true,
  job: {
    select: {
      title: true,
      cityName: true,
      stateName: true,
      status: true,
      expiresAt: true,
      employer: { select: { businessName: true, verificationStatus: true } },
    },
  },
} satisfies Prisma.SavedJobSelect;

@Injectable()
export class PrismaSavedJobsRepository implements SavedJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, jobId: string): Promise<SavedJobState> {
    await this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "jobs" WHERE "id" = ${jobId}::uuid FOR UPDATE`;
      const job = await tx.job.findFirst({
        where: {
          id: jobId,
          ...publicJobEligibility(new Date()),
        },
        select: { id: true },
      });
      if (!job) throw new SavedJobUnavailableError();
      const seeker = await tx.seekerProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });
      await tx.savedJob.upsert({
        where: { seekerProfileId_jobId: { seekerProfileId: seeker.id, jobId } },
        create: { seekerProfileId: seeker.id, jobId },
        update: {},
      });
    });
    return { jobId, saved: true };
  }

  async remove(userId: string, jobId: string): Promise<SavedJobState> {
    await this.prisma.client.savedJob.deleteMany({
      where: { jobId, seeker: { is: { userId } } },
    });
    return { jobId, saved: false };
  }

  async findState(userId: string, jobId: string): Promise<SavedJobState> {
    const saved = await this.prisma.client.savedJob.findFirst({
      where: { jobId, seeker: { is: { userId } } },
      select: { id: true },
    });
    return { jobId, saved: saved !== null };
  }

  async list(userId: string, query: SavedJobsQuery): Promise<SavedJobListResponse> {
    const where: Prisma.SavedJobWhereInput = { seeker: { is: { userId } } };
    const [records, total] = await Promise.all([
      this.prisma.client.savedJob.findMany({
        where,
        select: savedJobSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.client.savedJob.count({ where }),
    ]);
    const now = new Date();
    return {
      items: records.map(({ jobId, createdAt, job }) => ({
        jobId,
        savedAt: createdAt.toISOString(),
        job:
          job.status === 'PUBLISHED' &&
          job.employer.verificationStatus === 'VERIFIED' &&
          (!job.expiresAt || job.expiresAt > now)
            ? {
                title: job.title,
                cityName: job.cityName,
                stateName: job.stateName,
                employerName: job.employer.businessName,
              }
            : null,
      })),
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }
}
