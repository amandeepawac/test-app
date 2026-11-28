import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db/generated';
import type {
  CreateApplication,
  EmployerApplicationListResponse,
  SeekerApplicationListResponse,
  UpdateApplicationStatus,
} from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  ApplicationConflictError,
  ApplicationJobUnavailableError,
  ApplicationProfileIncompleteError,
  ApplicationRecordNotFoundError,
  ApplicationStatusTransitionError,
  ApplicationWithdrawNotAllowedError,
} from '@/modules/applications/application-errors.js';
import { ApplicationRepository } from '@/modules/applications/application.repository.js';

const historySelect = {
  oldStatus: true,
  newStatus: true,
  note: true,
  createdAt: true,
} as const;

const seekerListSelect = {
  id: true,
  status: true,
  coverMessage: true,
  appliedAt: true,
  updatedAt: true,
  withdrawnAt: true,
  job: {
    select: {
      id: true,
      title: true,
      cityName: true,
      stateName: true,
      employer: { select: { businessName: true } },
    },
  },
  statusHistory: { orderBy: { createdAt: 'asc' }, select: historySelect },
} satisfies Prisma.JobApplicationSelect;

const employerListSelect = {
  id: true,
  status: true,
  coverMessage: true,
  appliedAt: true,
  updatedAt: true,
  seeker: {
    select: {
      id: true,
      fullName: true,
      experienceLevel: true,
      experienceSummary: true,
      cityName: true,
      stateName: true,
      showEmail: true,
      showPhone: true,
      user: { select: { email: true, phone: true } },
      skills: {
        orderBy: { skill: { name: 'asc' } },
        select: { skill: { select: { name: true } } },
      },
    },
  },
  statusHistory: { orderBy: { createdAt: 'asc' }, select: historySelect },
} satisfies Prisma.JobApplicationSelect;

type SeekerApplicationRecord = Prisma.JobApplicationGetPayload<{
  select: typeof seekerListSelect;
}>;
type EmployerApplicationRecord = Prisma.JobApplicationGetPayload<{
  select: typeof employerListSelect;
}>;

function isoHistory(history: Array<{
  oldStatus: string | null;
  newStatus: string;
  note: string | null;
  createdAt: Date;
}>) {
  return history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }));
}

function toSeekerApplication(application: SeekerApplicationRecord) {
  return {
    id: application.id,
    status: application.status,
    coverMessage: application.coverMessage,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    withdrawnAt: application.withdrawnAt?.toISOString() ?? null,
    job: {
      id: application.job.id,
      title: application.job.title,
      cityName: application.job.cityName,
      stateName: application.job.stateName,
      employerName: application.job.employer.businessName,
    },
    history: isoHistory(application.statusHistory),
  };
}

function toEmployerApplication(application: EmployerApplicationRecord) {
  return {
    id: application.id,
    status: application.status,
    coverMessage: application.coverMessage,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    seeker: {
      id: application.seeker.id,
      fullName: application.seeker.fullName,
      experienceLevel: application.seeker.experienceLevel,
      experienceSummary: application.seeker.experienceSummary,
      cityName: application.seeker.cityName,
      stateName: application.seeker.stateName,
      email: application.seeker.showEmail ? application.seeker.user.email : null,
      phone: application.seeker.showPhone ? application.seeker.user.phone : null,
      skills: application.seeker.skills.map(({ skill }) => skill.name),
    },
    history: isoHistory(application.statusHistory),
  };
}

const employerTransitions: Record<string, readonly string[]> = {
  APPLIED: ['REVIEWING', 'SHORTLISTED', 'CONTACTED', 'REJECTED', 'HIRED'],
  REVIEWING: ['SHORTLISTED', 'CONTACTED', 'REJECTED', 'HIRED'],
  SHORTLISTED: ['CONTACTED', 'REJECTED', 'HIRED'],
  CONTACTED: ['REJECTED', 'HIRED'],
  REJECTED: [],
  HIRED: [],
  WITHDRAWN: [],
};

@Injectable()
export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, jobId: string, input: CreateApplication) {
    try {
      return await this.prisma.client.$transaction(async (tx) => {
        const seeker = await tx.seekerProfile.findUnique({
          where: { userId },
          select: { id: true, completedAt: true },
        });
        if (!seeker?.completedAt) throw new ApplicationProfileIncompleteError();

        await tx.$queryRaw`SELECT "id" FROM "jobs" WHERE "id" = ${jobId}::uuid FOR UPDATE`;
        const now = new Date();
        const job = await tx.job.findFirst({
          where: {
            id: jobId,
            status: 'PUBLISHED',
            employer: { is: { verificationStatus: 'VERIFIED' } },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          select: {
            id: true,
            title: true,
            employer: { select: { userId: true } },
          },
        });
        if (!job) throw new ApplicationJobUnavailableError();

        const application = await tx.jobApplication.create({
          data: {
            jobId,
            seekerProfileId: seeker.id,
            status: 'APPLIED',
            coverMessage: input.coverMessage || null,
            statusHistory: {
              create: {
                oldStatus: null,
                newStatus: 'APPLIED',
                changedById: userId,
              },
            },
          },
          select: { id: true, status: true, appliedAt: true },
        });

        await tx.notification.createMany({
          data: [
            {
              userId,
              type: 'APPLICATION_SUBMITTED',
              title: 'Application submitted',
              body: `Your application for "${job.title}" was submitted.`,
              resourceType: 'JOB_APPLICATION',
              resourceId: application.id,
              data: { status: 'APPLIED' },
            },
            {
              userId: job.employer.userId,
              type: 'NEW_APPLICATION_RECEIVED',
              title: 'New job application',
              body: `A job seeker applied for "${job.title}".`,
              resourceType: 'JOB_APPLICATION',
              resourceId: application.id,
              data: { status: 'APPLIED', jobId },
            },
          ],
        });
        return {
          id: application.id,
          status: 'APPLIED' as const,
          appliedAt: application.appliedAt.toISOString(),
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationConflictError();
      }
      throw error;
    }
  }

  async listForSeeker(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<SeekerApplicationListResponse> {
    const profile = await this.prisma.client.seekerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      return {
        items: [],
        pageInfo: { page, pageSize, total: 0, hasNextPage: false },
      };
    }
    const where = { seekerProfileId: profile.id };
    const [records, total] = await Promise.all([
      this.prisma.client.jobApplication.findMany({
        where,
        select: seekerListSelect,
        orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.jobApplication.count({ where }),
    ]);
    return {
      items: records.map(toSeekerApplication),
      pageInfo: { page, pageSize, total, hasNextPage: page * pageSize < total },
    };
  }

  async withdraw(userId: string, applicationId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "job_applications" WHERE "id" = ${applicationId}::uuid FOR UPDATE`;
      const current = await tx.jobApplication.findFirst({
        where: { id: applicationId, seeker: { is: { userId } } },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          job: { select: { title: true } },
        },
      });
      if (!current) throw new ApplicationRecordNotFoundError();
      if (current.status !== 'APPLIED') throw new ApplicationWithdrawNotAllowedError();
      const now = new Date();
      const updated = await tx.jobApplication.updateMany({
        where: { id: applicationId, status: 'APPLIED' },
        data: { status: 'WITHDRAWN', withdrawnAt: now },
      });
      if (updated.count !== 1) throw new ApplicationWithdrawNotAllowedError();
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          oldStatus: 'APPLIED',
          newStatus: 'WITHDRAWN',
          changedById: userId,
        },
      });
      await tx.notification.create({
        data: {
          userId,
          type: 'APPLICATION_STATUS_CHANGED',
          title: 'Application withdrawn',
          body: `Your application for "${current.job.title}" was withdrawn.`,
          resourceType: 'JOB_APPLICATION',
          resourceId: applicationId,
          data: { status: 'WITHDRAWN' },
        },
      });
      return {
        id: current.id,
        status: 'WITHDRAWN' as const,
        appliedAt: current.appliedAt.toISOString(),
      };
    });
  }

  async listForEmployer(
    userId: string,
    jobId: string,
    page: number,
    pageSize: number,
  ): Promise<EmployerApplicationListResponse> {
    const employer = await this.prisma.client.employerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!employer) throw new ApplicationRecordNotFoundError();
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, employerId: employer.id },
      select: { id: true },
    });
    if (!job) throw new ApplicationRecordNotFoundError();
    const records = await this.prisma.client.jobApplication.findMany({
      where: { jobId },
      select: employerListSelect,
      orderBy: [{ appliedAt: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await this.prisma.client.jobApplication.count({ where: { jobId } });
    return {
      items: records.map(toEmployerApplication),
      pageInfo: { page, pageSize, total, hasNextPage: page * pageSize < total },
    };
  }

  async updateStatus(
    userId: string,
    applicationId: string,
    input: UpdateApplicationStatus,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "job_applications" WHERE "id" = ${applicationId}::uuid FOR UPDATE`;
      const current = await tx.jobApplication.findFirst({
        where: {
          id: applicationId,
          job: { is: { employer: { is: { userId } } } },
        },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          seeker: { select: { userId: true } },
          job: { select: { title: true } },
        },
      });
      if (!current) throw new ApplicationRecordNotFoundError();
      if (!employerTransitions[current.status]?.includes(input.status)) {
        throw new ApplicationStatusTransitionError();
      }
      const updated = await tx.jobApplication.updateMany({
        where: { id: applicationId, status: current.status },
        data: { status: input.status },
      });
      if (updated.count !== 1) throw new ApplicationStatusTransitionError();
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          oldStatus: current.status,
          newStatus: input.status,
          changedById: userId,
          note: input.note ?? null,
        },
      });
      await tx.notification.create({
        data: {
          userId: current.seeker.userId,
          type: 'APPLICATION_STATUS_CHANGED',
          title: 'Application status updated',
          body: `Your application for "${current.job.title}" is now ${input.status.toLowerCase().replaceAll('_', ' ')}.`,
          resourceType: 'JOB_APPLICATION',
          resourceId: applicationId,
          data: { status: input.status },
        },
      });
      return {
        id: current.id,
        status: input.status,
        appliedAt: current.appliedAt.toISOString(),
      };
    });
  }
}
