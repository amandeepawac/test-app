import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jobSeekerProfileUpdateSchema } from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AuthService } from '@/modules/auth/services/auth.service.js';
import { JobSeekerAuthGuard } from '@/modules/job-seeker/guards/job-seeker-auth.guard.js';
import {
  JobSeekerInvalidSkillsError,
  JobSeekerProfileIncompleteError,
} from '@/modules/job-seeker/job-seeker-errors.js';
import { PrismaJobSeekerProfileRepository } from '@/modules/job-seeker/repositories/prisma-job-seeker-profile.repository.js';
import { JobSeekerProfileRepository } from '@/modules/job-seeker/repositories/job-seeker-profile.repository.js';
import { JobSeekerProfileService } from '@/modules/job-seeker/services/job-seeker-profile.service.js';

describe('job seeker profile request validation', () => {
  it('accepts partial drafts and rejects duplicate skills and unknown fields', () => {
    const skillId = '01947c6d-0000-7000-8000-000000000001';
    expect(jobSeekerProfileUpdateSchema.safeParse({ fullName: '  Sam  ' }).success).toBe(true);
    expect(jobSeekerProfileUpdateSchema.safeParse({ skillIds: [skillId, skillId] }).success).toBe(
      false,
    );
    expect(jobSeekerProfileUpdateSchema.safeParse({ completedAt: '2026-01-01' }).success).toBe(
      false,
    );
    expect(jobSeekerProfileUpdateSchema.safeParse({ phone: 'not-a-phone' }).success).toBe(false);
    expect(jobSeekerProfileUpdateSchema.safeParse({ phone: '+91 9876543210' }).success).toBe(true);
  });
});

describe('JobSeekerAuthGuard', () => {
  const auth = { currentUser: vi.fn() };
  const prisma = { client: { user: { findUnique: vi.fn() } } };
  let guard: JobSeekerAuthGuard;

  const context = (authorization?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        JobSeekerAuthGuard,
        { provide: AuthService, useValue: auth },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = module.get(JobSeekerAuthGuard);
  });

  it('rejects missing credentials and non-seeker roles', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    auth.currentUser.mockResolvedValue({ id: 'user-id' });
    prisma.client.user.findUnique.mockResolvedValue({ primaryRole: 'EMPLOYER' });
    await expect(guard.canActivate(context('Bearer token'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('accepts an authenticated job seeker', async () => {
    auth.currentUser.mockResolvedValue({ id: 'user-id' });
    prisma.client.user.findUnique.mockResolvedValue({ primaryRole: 'JOB_SEEKER' });
    await expect(guard.canActivate(context('Bearer token'))).resolves.toBe(true);
  });
});

describe('PrismaJobSeekerProfileRepository', () => {
  const tx = {
    $queryRaw: vi.fn(),
    skill: { count: vi.fn() },
    user: { update: vi.fn() },
    seekerProfile: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    seekerSkill: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  const prisma = { client: { $transaction: vi.fn() } };
  let repository: PrismaJobSeekerProfileRepository;

  const profile = {
    id: 'profile-id',
    fullName: 'Sam',
    stateName: 'Punjab',
    cityName: 'Ludhiana',
    experienceLevel: 'NO_EXPERIENCE',
    experienceSummary: null,
    showEmail: false,
    showPhone: false,
    completedAt: null,
    user: { email: 'sam@example.com', phone: '1234567890' },
    skills: [],
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    const module = await Test.createTestingModule({
      providers: [
        PrismaJobSeekerProfileRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = module.get(PrismaJobSeekerProfileRepository);
  });

  it('rejects completion until every required field is present', async () => {
    tx.seekerProfile.findUnique.mockResolvedValue({ ...profile, experienceLevel: null });
    await expect(repository.complete('user-id')).rejects.toBeInstanceOf(
      JobSeekerProfileIncompleteError,
    );
    expect(tx.seekerProfile.update).not.toHaveBeenCalled();
  });

  it('completes a valid profile and returns the completion timestamp', async () => {
    const completedAt = new Date('2026-11-26T00:00:00.000Z');
    tx.seekerProfile.findUnique.mockResolvedValue(profile);
    tx.seekerProfile.update.mockResolvedValue({ ...profile, completedAt });
    await expect(repository.complete('user-id')).resolves.toMatchObject({
      completedAt: completedAt.toISOString(),
      showEmail: false,
      showPhone: false,
    });
  });

  it('rejects unavailable skills before changing the profile', async () => {
    tx.skill.count.mockResolvedValue(0);
    await expect(repository.save('user-id', { skillIds: ['skill-id'] })).rejects.toBeInstanceOf(
      JobSeekerInvalidSkillsError,
    );
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('updates skills without replacing records that are still selected', async () => {
    tx.skill.count.mockResolvedValue(1);
    tx.seekerProfile.upsert.mockResolvedValue({ id: 'profile-id' });
    tx.seekerProfile.findUniqueOrThrow.mockResolvedValue(profile);
    await repository.save('user-id', { skillIds: ['skill-id'] });
    expect(tx.seekerSkill.deleteMany).toHaveBeenCalledWith({
      where: { seekerProfileId: 'profile-id', skillId: { notIn: ['skill-id'] } },
    });
    expect(tx.seekerSkill.createMany).toHaveBeenCalledWith({
      data: [{ seekerProfileId: 'profile-id', skillId: 'skill-id' }],
      skipDuplicates: true,
    });
  });
});

describe('JobSeekerProfileService', () => {
  it('maps incomplete profile errors to a client error', async () => {
    const module = await Test.createTestingModule({
      providers: [
        JobSeekerProfileService,
        {
          provide: JobSeekerProfileRepository,
          useValue: { complete: vi.fn().mockRejectedValue(new JobSeekerProfileIncompleteError()) },
        },
      ],
    }).compile();
    const service = module.get(JobSeekerProfileService);
    await expect(service.complete('user-id')).rejects.toBeInstanceOf(BadRequestException);
  });
});
