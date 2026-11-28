import { Test } from '@nestjs/testing';
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { ApplicationProfileIncompleteError } from '@/modules/applications/application-errors.js';
import { PrismaApplicationRepository } from '@/modules/applications/prisma-application.repository.js';

describe('PrismaApplicationRepository', () => {
  const tx = {
    seekerProfile: { findUnique: vi.fn() },
    $queryRaw: vi.fn(),
    job: { findFirst: vi.fn() },
    jobApplication: { create: vi.fn() },
    notification: { createMany: vi.fn() },
  };
  const prisma = { client: { $transaction: vi.fn() } };
  let repository: PrismaApplicationRepository;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    tx.seekerProfile.findUnique.mockResolvedValue({
      id: 'seeker-profile-id',
      completedAt: new Date(),
    });
    tx.job.findFirst.mockResolvedValue({
      id: 'job-id',
      title: 'Cook',
      employer: { userId: 'employer-user-id' },
    });
    tx.jobApplication.create.mockResolvedValue({
      id: 'application-id',
      status: 'APPLIED',
      appliedAt: new Date('2026-11-28T00:00:00.000Z'),
    });
    const module = await Test.createTestingModule({
      providers: [
        PrismaApplicationRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = module.get(PrismaApplicationRepository);
  });

  it('accepts a message and rejects client-selected application statuses', () => {
    expect(createApplicationSchema.safeParse({ coverMessage: 'Interested.' }).success).toBe(true);
    expect(createApplicationSchema.safeParse({ status: 'HIRED' }).success).toBe(false);
    expect(updateApplicationStatusSchema.safeParse({ status: 'REVIEWING' }).success).toBe(true);
    expect(updateApplicationStatusSchema.safeParse({ status: 'APPLIED' }).success).toBe(false);
    expect(updateApplicationStatusSchema.safeParse({ status: 'WITHDRAWN' }).success).toBe(false);
  });

  it('requires a completed seeker profile before creating an application', async () => {
    tx.seekerProfile.findUnique.mockResolvedValue({
      id: 'seeker-profile-id',
      completedAt: null,
    });
    await expect(repository.apply('seeker-user-id', 'job-id', {})).rejects.toBeInstanceOf(
      ApplicationProfileIncompleteError,
    );
    expect(tx.jobApplication.create).not.toHaveBeenCalled();
  });

  it('creates the application, initial history, and notifications atomically', async () => {
    await expect(
      repository.apply('seeker-user-id', 'job-id', { coverMessage: 'I am interested.' }),
    ).resolves.toMatchObject({ id: 'application-id', status: 'APPLIED' });
    expect(tx.jobApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobId: 'job-id',
          seekerProfileId: 'seeker-profile-id',
          coverMessage: 'I am interested.',
          statusHistory: {
            create: {
              oldStatus: null,
              newStatus: 'APPLIED',
              changedById: 'seeker-user-id',
            },
          },
        }),
      }),
    );
    expect(tx.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: 'seeker-user-id', type: 'APPLICATION_SUBMITTED' }),
        expect.objectContaining({
          userId: 'employer-user-id',
          type: 'NEW_APPLICATION_RECEIVED',
        }),
      ]),
    });
  });
});
