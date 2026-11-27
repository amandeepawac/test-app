import { Test } from '@nestjs/testing';
import { employerJobCreateSchema, employerJobUpdateSchema } from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  EmployerJobConflictError, EmployerJobInputError, EmployerJobNotFoundError, JobProfileIncompleteError,
  JobVerificationRequiredError,
} from '@/modules/employers/employer-jobs-errors.js';
import { PrismaEmployerJobsRepository } from '@/modules/employers/repositories/prisma-employer-jobs.repository.js';

const draft = { title: 'Cook', description: 'Prepare meals', employmentType: 'FULL_TIME' } as const;

describe('employer job request validation', () => {
  it('accepts a draft but rejects server-managed fields and duplicate skills', () => {
    const skillId = '01900000-0000-7000-8000-000000000001';
    expect(employerJobCreateSchema.safeParse(draft).success).toBe(true);
    expect(employerJobCreateSchema.safeParse({ ...draft, status: 'PUBLISHED' }).success).toBe(false);
    expect(employerJobUpdateSchema.safeParse({ employerId: skillId }).success).toBe(false);
    expect(employerJobUpdateSchema.safeParse({ skillIds: [skillId, skillId] }).success).toBe(false);
  });
});

describe('PrismaEmployerJobsRepository', () => {
  const tx = {
    $queryRaw: vi.fn(),
    employerProfile: { findUnique: vi.fn() },
    job: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    jobCategory: { findFirst: vi.fn() },
    skill: { count: vi.fn() },
    jobSkill: { deleteMany: vi.fn(), createMany: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prisma = { client: { $transaction: vi.fn() } };
  let repository: PrismaEmployerJobsRepository;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    tx.employerProfile.findUnique.mockResolvedValue({ id: 'employer-id', completedAt: new Date() });
    const module = await Test.createTestingModule({
      providers: [PrismaEmployerJobsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get(PrismaEmployerJobsRepository);
  });

  it('requires a completed profile but not employer verification', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({ id: 'employer-id', completedAt: null });
    await expect(repository.create('user-id', draft)).rejects.toBeInstanceOf(JobProfileIncompleteError);
    expect(tx.job.create).not.toHaveBeenCalled();

    tx.employerProfile.findUnique.mockResolvedValue({ id: 'employer-id', completedAt: new Date() });
    tx.job.create.mockResolvedValue({
      ...draft, id: 'job-id', status: 'DRAFT', skills: [], salaryMin: null, salaryMax: null,
      expiresAt: null, createdAt: new Date(), updatedAt: new Date(),
    });
    await expect(repository.create('user-id', draft)).resolves.toMatchObject({ status: 'DRAFT' });
    expect(tx.job.create.mock.calls[0][0].data).not.toHaveProperty('status');
  });

  it('does not edit another employer’s job or a non-draft job', async () => {
    tx.job.findFirst.mockResolvedValue(null);
    await expect(repository.update('user-id', 'job-id', { title: 'New' })).rejects.toBeInstanceOf(EmployerJobNotFoundError);
    expect(tx.job.findFirst.mock.calls[0][0].where).toEqual({ id: 'job-id', employerId: 'employer-id' });
    tx.job.findFirst.mockResolvedValue({ status: 'PENDING_REVIEW' });
    await expect(repository.update('user-id', 'job-id', { title: 'New' })).rejects.toBeInstanceOf(EmployerJobConflictError);
    expect(tx.job.update).not.toHaveBeenCalled();
  });

  it('checks salary bounds against existing values and rejects inactive references', async () => {
    tx.job.findFirst.mockResolvedValue({
      status: 'DRAFT', salaryMin: { toNumber: () => 100 }, salaryMax: { toNumber: () => 200 },
    });
    await expect(repository.update('user-id', 'job-id', { salaryMin: 300 })).rejects.toBeInstanceOf(EmployerJobInputError);
    tx.skill.count.mockResolvedValue(0);
    await expect(repository.update('user-id', 'job-id', { skillIds: ['skill-id'] })).rejects.toBeInstanceOf(EmployerJobInputError);
    expect(tx.jobSkill.deleteMany).not.toHaveBeenCalled();
  });

  it('updates a draft and replaces its skills in the same transaction', async () => {
    tx.job.findFirst.mockResolvedValue({ status: 'DRAFT', salaryMin: null, salaryMax: null });
    tx.skill.count.mockResolvedValue(1);
    tx.job.update.mockResolvedValue({
      ...draft, title: 'Updated cook', id: 'job-id', status: 'DRAFT',
      skills: [{ skillId: 'skill-id' }], salaryMin: null, salaryMax: null,
      expiresAt: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await repository.update('user-id', 'job-id', {
      title: 'Updated cook', skillIds: ['skill-id'],
    });
    expect(result).toMatchObject({ title: 'Updated cook', skillIds: ['skill-id'] });
    expect(tx.jobSkill.deleteMany).toHaveBeenCalledWith({ where: { jobId: 'job-id' } });
    expect(tx.jobSkill.createMany).toHaveBeenCalledWith({
      data: [{ jobId: 'job-id', skillId: 'skill-id' }],
    });
  });

  it('only publishes for verified employers and never republishes removed jobs', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({
      id: 'employer-id', completedAt: new Date(), verificationStatus: 'NOT_SUBMITTED',
    });
    tx.job.findFirst.mockResolvedValue({ status: 'DRAFT', expiresAt: null });
    await expect(repository.transition('user-id', 'job-id', 'publish')).rejects.toBeInstanceOf(JobVerificationRequiredError);
    tx.employerProfile.findUnique.mockResolvedValue({
      id: 'employer-id', completedAt: new Date(), verificationStatus: 'VERIFIED',
    });
    tx.job.findFirst.mockResolvedValue({ status: 'REMOVED', expiresAt: null });
    await expect(repository.transition('user-id', 'job-id', 'publish')).rejects.toBeInstanceOf(EmployerJobConflictError);
    tx.job.findFirst.mockResolvedValue({ status: 'HIDDEN', expiresAt: null });
    await expect(repository.transition('user-id', 'job-id', 'publish')).rejects.toBeInstanceOf(EmployerJobConflictError);
    tx.job.findFirst.mockResolvedValue({ status: 'DRAFT', expiresAt: new Date('2000-01-01') });
    await expect(repository.transition('user-id', 'job-id', 'publish')).rejects.toBeInstanceOf(EmployerJobInputError);
    expect(tx.job.update).not.toHaveBeenCalled();
  });

  it('publishes a verified employer draft directly and records the transition', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({
      id: 'employer-id', completedAt: new Date(), verificationStatus: 'VERIFIED',
    });
    tx.job.findFirst.mockResolvedValue({ status: 'DRAFT', expiresAt: null });
    tx.job.update.mockResolvedValue({
      ...draft, id: 'job-id', status: 'PUBLISHED', skills: [], salaryMin: null, salaryMax: null,
      expiresAt: null, createdAt: new Date(), updatedAt: new Date(),
    });
    await expect(repository.transition('user-id', 'job-id', 'publish')).resolves.toMatchObject({ status: 'PUBLISHED' });
    expect(tx.job.update.mock.calls[0][0].data).toMatchObject({ status: 'PUBLISHED', publishedAt: expect.any(Date) });
    expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({
      actorId: 'user-id', action: 'JOB_PUBLISH', metadata: { fromStatus: 'DRAFT', status: 'PUBLISHED' },
    });
  });

  it('allows employers to pause published jobs without verification', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({
      id: 'employer-id', completedAt: new Date(), verificationStatus: 'SUSPENDED',
    });
    tx.job.findFirst.mockResolvedValue({ status: 'PUBLISHED', expiresAt: null });
    tx.job.update.mockResolvedValue({
      ...draft, id: 'job-id', status: 'PAUSED', skills: [], salaryMin: null, salaryMax: null,
      expiresAt: null, createdAt: new Date(), updatedAt: new Date(),
    });
    await expect(repository.transition('user-id', 'job-id', 'pause')).resolves.toMatchObject({ status: 'PAUSED' });
  });
});
