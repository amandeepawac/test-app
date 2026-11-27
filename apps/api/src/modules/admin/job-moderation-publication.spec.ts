import { Test } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AdminStateConflictError } from '@/modules/admin/admin-errors.js';
import { PrismaJobModerationRepository } from '@/modules/admin/repositories/prisma-job-moderation.repository.js';

describe('admin job approval publication gate', () => {
  it('does not publish an unverified employer’s legacy pending job', async () => {
    const tx = {
      $queryRaw: vi.fn(),
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job-id', title: 'Cook', status: 'PENDING_REVIEW', expiresAt: null,
          employer: { id: 'employer-id', userId: 'user-id' },
        }),
        updateMany: vi.fn(),
      },
      employerProfile: {
        findUnique: vi.fn().mockResolvedValue({ completedAt: new Date(), verificationStatus: 'REJECTED' }),
      },
    };
    const prisma = { client: { $transaction: vi.fn((operation) => operation(tx)) } };
    const module = await Test.createTestingModule({
      providers: [PrismaJobModerationRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const repository = module.get(PrismaJobModerationRepository);
    await expect(repository.moderate(
      'job-id', { decision: 'APPROVE', reason: 'Reviewed' },
      { actorId: 'admin-id', ipAddress: null, userAgent: null },
    )).rejects.toBeInstanceOf(AdminStateConflictError);
    expect(tx.job.updateMany).not.toHaveBeenCalled();
  });

  it('hides a published job and only restores a verified, unexpired job', async () => {
    const tx = {
      $queryRaw: vi.fn(),
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job-id', title: 'Cook', status: 'PUBLISHED', expiresAt: null,
          employer: { id: 'employer-id', userId: 'user-id' },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      employerProfile: {
        findUnique: vi.fn().mockResolvedValue({ completedAt: new Date(), verificationStatus: 'VERIFIED' }),
      },
      auditLog: { create: vi.fn() },
      notification: { create: vi.fn() },
    };
    const prisma = { client: { $transaction: vi.fn((operation) => operation(tx)) } };
    const module = await Test.createTestingModule({
      providers: [PrismaJobModerationRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const repository = module.get(PrismaJobModerationRepository);
    const context = { actorId: 'admin-id', ipAddress: null, userAgent: null };
    await expect(repository.moderate('job-id', { decision: 'HIDE', reason: 'Review' }, context))
      .resolves.toMatchObject({ status: 'HIDDEN' });
    expect(tx.auditLog.create.mock.calls[0][0].data.action).toBe('JOB_HIDE');
    tx.job.findUnique.mockResolvedValue({
      id: 'job-id', title: 'Cook', status: 'HIDDEN', expiresAt: null,
      employer: { id: 'employer-id', userId: 'user-id' },
    });
    tx.employerProfile.findUnique.mockResolvedValue({ completedAt: new Date(), verificationStatus: 'SUSPENDED' });
    await expect(repository.moderate('job-id', { decision: 'RESTORE', reason: 'Resolved' }, context))
      .rejects.toBeInstanceOf(AdminStateConflictError);
    tx.employerProfile.findUnique.mockResolvedValue({ completedAt: new Date(), verificationStatus: 'VERIFIED' });
    await expect(repository.moderate('job-id', { decision: 'RESTORE', reason: 'Resolved' }, context))
      .resolves.toMatchObject({ status: 'PUBLISHED' });
    expect(tx.job.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { id: 'job-id', status: 'HIDDEN' },
    }));
  });
});
