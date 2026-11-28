import { Test } from '@nestjs/testing';
import { savedJobListResponseSchema, savedJobsQuerySchema } from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { SavedJobUnavailableError } from '@/modules/job-seeker/job-seeker-errors.js';
import { PrismaSavedJobsRepository } from './prisma-saved-jobs.repository.js';

describe('PrismaSavedJobsRepository', () => {
  const tx = {
    $queryRaw: vi.fn(),
    job: { findFirst: vi.fn() },
    seekerProfile: { upsert: vi.fn() },
    savedJob: { upsert: vi.fn() },
  };
  const savedJob = {
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  };
  const prisma = { client: { $transaction: vi.fn(), savedJob } };
  let repository: PrismaSavedJobsRepository;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    tx.job.findFirst.mockResolvedValue({ id: 'job-id' });
    tx.seekerProfile.upsert.mockResolvedValue({ id: 'profile-id' });
    const module = await Test.createTestingModule({
      providers: [
        PrismaSavedJobsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = module.get(PrismaSavedJobsRepository);
  });

  it('saves an eligible job idempotently for the authenticated seeker', async () => {
    await expect(repository.save('user-id', 'job-id')).resolves.toEqual({
      jobId: 'job-id',
      saved: true,
    });
    expect(tx.job.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'job-id',
          status: 'PUBLISHED',
          employer: { is: { verificationStatus: 'VERIFIED' } },
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        }),
      }),
    );
    expect(tx.seekerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-id' }, create: { userId: 'user-id' } }),
    );
    expect(tx.savedJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { seekerProfileId_jobId: { seekerProfileId: 'profile-id', jobId: 'job-id' } },
        update: {},
      }),
    );
  });

  it('rejects unavailable jobs before creating a profile or saved record', async () => {
    tx.job.findFirst.mockResolvedValue(null);
    await expect(repository.save('user-id', 'job-id')).rejects.toBeInstanceOf(
      SavedJobUnavailableError,
    );
    expect(tx.seekerProfile.upsert).not.toHaveBeenCalled();
    expect(tx.savedJob.upsert).not.toHaveBeenCalled();
  });

  it('scopes saved state and removal to the authenticated seeker', async () => {
    savedJob.findFirst.mockResolvedValue(null);
    savedJob.deleteMany.mockResolvedValue({ count: 0 });
    await expect(repository.findState('user-id', 'job-id')).resolves.toEqual({
      jobId: 'job-id',
      saved: false,
    });
    await expect(repository.remove('user-id', 'job-id')).resolves.toEqual({
      jobId: 'job-id',
      saved: false,
    });
    expect(savedJob.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jobId: 'job-id', seeker: { is: { userId: 'user-id' } } } }),
    );
    expect(savedJob.deleteMany).toHaveBeenCalledWith({
      where: { jobId: 'job-id', seeker: { is: { userId: 'user-id' } } },
    });
    savedJob.findFirst.mockResolvedValue({ id: 'saved-id' });
    await expect(repository.findState('user-id', 'job-id')).resolves.toEqual({
      jobId: 'job-id',
      saved: true,
    });
  });

  it('lists unavailable saved jobs without exposing their details', async () => {
    const jobId = '01900000-0000-7000-8000-000000000001';
    const common = {
      jobId,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      job: {
        title: 'Cook',
        cityName: 'Ludhiana',
        stateName: 'Punjab',
        status: 'PUBLISHED',
        expiresAt: null,
        employer: { businessName: 'Shop', verificationStatus: 'VERIFIED' },
      },
    };
    savedJob.findMany.mockResolvedValue([
      common,
      { ...common, job: { ...common.job, status: 'HIDDEN' } },
      { ...common, job: { ...common.job, expiresAt: new Date(0) } },
      {
        ...common,
        job: {
          ...common.job,
          employer: { ...common.job.employer, verificationStatus: 'SUSPENDED' },
        },
      },
    ]);
    savedJob.count.mockResolvedValue(4);
    const result = await repository.list('user-id', { page: 1, pageSize: 20 });
    expect(savedJobListResponseSchema.safeParse(result).success).toBe(true);
    expect(result.items[0]?.job).toEqual({
      title: 'Cook',
      cityName: 'Ludhiana',
      stateName: 'Punjab',
      employerName: 'Shop',
    });
    expect(result.items.slice(1).map((item) => item.job)).toEqual([null, null, null]);
    expect(savedJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { seeker: { is: { userId: 'user-id' } } },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('validates pagination limits', () => {
    expect(savedJobsQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(savedJobsQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(savedJobsQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});
