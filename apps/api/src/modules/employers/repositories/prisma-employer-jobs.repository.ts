import { Injectable } from '@nestjs/common';
import type {
  EmployerJobCreate, EmployerJobListResponse, EmployerJobResponse, EmployerJobsQuery, EmployerJobUpdate,
} from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  EmployerJobConflictError, EmployerJobInputError, EmployerJobNotFoundError, JobProfileIncompleteError,
  JobVerificationRequiredError,
} from '@/modules/employers/employer-jobs-errors.js';
import { EmployerJobsRepository } from './employer-jobs.repository.js';

const jobSelect = {
  id: true, title: true, description: true, employmentType: true, categoryId: true,
  responsibilities: true, workMode: true, experienceLevel: true, salaryMin: true,
  salaryMax: true, salaryPeriod: true, isSalaryNegotiable: true, openings: true,
  addressLine: true, localityName: true, cityName: true, districtName: true,
  stateName: true, postalCode: true, workingHours: true, shiftDetails: true,
  isUrgent: true, expiresAt: true, status: true, moderationNote: true,
  createdAt: true, updatedAt: true,
  skills: { select: { skillId: true }, orderBy: { skillId: 'asc' } },
} satisfies Prisma.JobSelect;

type JobRecord = Prisma.JobGetPayload<{ select: typeof jobSelect }>;

function toResponse(job: JobRecord): EmployerJobResponse {
  const { skills, salaryMin, salaryMax, expiresAt, createdAt, updatedAt, ...rest } = job;
  return {
    ...rest,
    skillIds: skills.map((skill) => skill.skillId),
    salaryMin: salaryMin?.toString() ?? null,
    salaryMax: salaryMax?.toString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

async function requireProfile(db: Prisma.TransactionClient, userId: string): Promise<string> {
  const profile = await db.employerProfile.findUnique({
    where: { userId }, select: { id: true, completedAt: true },
  });
  if (!profile?.completedAt) throw new JobProfileIncompleteError();
  return profile.id;
}

async function validateReferences(
  db: Prisma.TransactionClient,
  input: EmployerJobUpdate,
  current?: JobRecord,
) {
  const min = input.salaryMin === undefined ? current?.salaryMin?.toNumber() : input.salaryMin;
  const max = input.salaryMax === undefined ? current?.salaryMax?.toNumber() : input.salaryMax;
  if (min != null && max != null && min > max) {
    throw new EmployerJobInputError('Minimum salary cannot exceed maximum salary');
  }
  if (input.categoryId) {
    const category = await db.jobCategory.findFirst({
      where: { id: input.categoryId, isActive: true }, select: { id: true },
    });
    if (!category) throw new EmployerJobInputError('Category is not available');
  }
  if (input.skillIds?.length) {
    const count = await db.skill.count({ where: { id: { in: input.skillIds }, isActive: true } });
    if (count !== input.skillIds.length) throw new EmployerJobInputError('One or more skills are not available');
  }
}

function jobData(input: EmployerJobUpdate) {
  const { skillIds: _skillIds, expiresAt, ...fields } = input;
  return { ...fields, ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}) };
}

@Injectable()
export class PrismaEmployerJobsRepository implements EmployerJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: EmployerJobCreate): Promise<EmployerJobResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      const employerId = await requireProfile(tx, userId);
      await validateReferences(tx, input);
      const { title, description, employmentType } = input;
      const job = await tx.job.create({
        data: {
          ...jobData(input), title, description, employmentType, employerId,
          skills: { create: input.skillIds?.map((skillId) => ({ skillId })) ?? [] },
        },
        select: jobSelect,
      });
      return toResponse(job);
    });
  }

  async list(userId: string, query: EmployerJobsQuery): Promise<EmployerJobListResponse> {
    const employerId = await requireProfile(this.prisma.client, userId);
    const where = { employerId };
    const [jobs, total] = await Promise.all([
      this.prisma.client.job.findMany({
        where, select: jobSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      }),
      this.prisma.client.job.count({ where }),
    ]);
    return {
      items: jobs.map(toResponse),
      pageInfo: { ...query, total, hasNextPage: query.page * query.pageSize < total },
    };
  }

  async findById(userId: string, id: string): Promise<EmployerJobResponse> {
    const employerId = await requireProfile(this.prisma.client, userId);
    const job = await this.prisma.client.job.findFirst({ where: { id, employerId }, select: jobSelect });
    if (!job) throw new EmployerJobNotFoundError();
    return toResponse(job);
  }

  async update(userId: string, id: string, input: EmployerJobUpdate): Promise<EmployerJobResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      const employerId = await requireProfile(tx, userId);
      await tx.$queryRaw`SELECT "id" FROM "jobs" WHERE "id" = ${id}::uuid AND "employerId" = ${employerId}::uuid FOR UPDATE`;
      const current = await tx.job.findFirst({ where: { id, employerId }, select: jobSelect });
      if (!current) throw new EmployerJobNotFoundError();
      if (current.status !== 'DRAFT' && current.status !== 'PAUSED') throw new EmployerJobConflictError();
      await validateReferences(tx, input, current);
      if (input.skillIds !== undefined) {
        await tx.jobSkill.deleteMany({ where: { jobId: id } });
        if (input.skillIds.length) {
          await tx.jobSkill.createMany({ data: input.skillIds.map((skillId) => ({ jobId: id, skillId })) });
        }
      }
      const job = await tx.job.update({ where: { id }, data: jobData(input), select: jobSelect });
      return toResponse(job);
    });
  }

  async transition(userId: string, id: string, action: 'publish' | 'pause'): Promise<EmployerJobResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "employer_profiles" WHERE "userId" = ${userId}::uuid FOR UPDATE`;
      const profile = await tx.employerProfile.findUnique({
        where: { userId }, select: { id: true, completedAt: true, verificationStatus: true },
      });
      if (!profile?.completedAt) throw new JobProfileIncompleteError();
      await tx.$queryRaw`SELECT "id" FROM "jobs" WHERE "id" = ${id}::uuid AND "employerId" = ${profile.id}::uuid FOR UPDATE`;
      const current = await tx.job.findFirst({ where: { id, employerId: profile.id }, select: jobSelect });
      if (!current) throw new EmployerJobNotFoundError();
      if (action === 'publish' && profile.verificationStatus !== 'VERIFIED') {
        throw new JobVerificationRequiredError();
      }
      if (action === 'publish' ? !['DRAFT', 'PAUSED'].includes(current.status) : current.status !== 'PUBLISHED') {
        throw new EmployerJobConflictError();
      }
      const now = new Date();
      if (action === 'publish' && current.expiresAt && current.expiresAt <= now) {
        throw new EmployerJobInputError('Job expiry must be in the future');
      }
      const status = action === 'publish' ? 'PUBLISHED' : 'PAUSED';
      const job = await tx.job.update({
        where: { id },
        data: { status, ...(action === 'publish' && current.status === 'DRAFT' ? { publishedAt: now } : {}) },
        select: jobSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId: userId, action: `JOB_${action.toUpperCase()}`, entityType: 'JOB', entityId: id,
          metadata: { fromStatus: current.status, status },
        },
      });
      return toResponse(job);
    });
  }
}
