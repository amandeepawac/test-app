import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { employerProfileUpdateSchema, registrationRequestSchema } from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AuthService } from '@/modules/auth/services/auth.service.js';
import {
  EmployerIdentityChangeConflictError,
  EmployerProfileIncompleteError,
} from '@/modules/employers/employer-errors.js';
import { EmployerAuthGuard } from '@/modules/employers/guards/employer-auth.guard.js';
import { EmployerProfileRepository } from '@/modules/employers/repositories/employer-profile.repository.js';
import { PrismaEmployerProfileRepository } from '@/modules/employers/repositories/prisma-employer-profile.repository.js';
import { EmployerProfileService } from '@/modules/employers/services/employer-profile.service.js';

describe('employer request validation', () => {
  it('accepts employer registration but rejects public admin registration', () => {
    const registration = { name: 'Sam', email: 'sam@example.com', password: 'password123' };
    expect(registrationRequestSchema.safeParse({ ...registration, role: 'EMPLOYER' }).success).toBe(
      true,
    );
    expect(registrationRequestSchema.safeParse({ ...registration, role: 'ADMIN' }).success).toBe(
      false,
    );
  });

  it('accepts partial drafts but rejects server-managed fields and unsafe websites', () => {
    expect(employerProfileUpdateSchema.safeParse({ cityName: 'Ludhiana' }).success).toBe(true);
    expect(employerProfileUpdateSchema.safeParse({ verificationStatus: 'VERIFIED' }).success).toBe(
      false,
    );
    expect(employerProfileUpdateSchema.safeParse({ userId: 'other-user' }).success).toBe(false);
    expect(
      employerProfileUpdateSchema.safeParse({ websiteUrl: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(employerProfileUpdateSchema.safeParse({ websiteUrl: 'not a url' }).success).toBe(false);
  });
});

describe('EmployerAuthGuard', () => {
  const auth = { currentUser: vi.fn() };
  const prisma = { client: { user: { findUnique: vi.fn() } } };
  let guard: EmployerAuthGuard;

  const context = (authorization?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmployerAuthGuard,
        { provide: AuthService, useValue: auth },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = module.get(EmployerAuthGuard);
  });

  it('rejects missing credentials and non-employer roles', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    auth.currentUser.mockResolvedValue({ id: 'user-id' });
    prisma.client.user.findUnique.mockResolvedValue({ primaryRole: 'JOB_SEEKER' });
    await expect(guard.canActivate(context('Bearer token'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('accepts an authenticated employer', async () => {
    auth.currentUser.mockResolvedValue({ id: 'user-id' });
    prisma.client.user.findUnique.mockResolvedValue({ primaryRole: 'EMPLOYER' });
    await expect(guard.canActivate(context('Bearer token'))).resolves.toBe(true);
  });
});

describe('PrismaEmployerProfileRepository', () => {
  const tx = {
    $queryRaw: vi.fn(),
    employerProfile: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
  };
  const prisma = { client: { $transaction: vi.fn() } };
  let repository: PrismaEmployerProfileRepository;

  const profile = {
    id: 'profile-id',
    businessName: 'Example Shop',
    employerType: 'SHOP',
    contactPersonName: 'Sam',
    businessPhone: '1234567890',
    stateName: 'Punjab',
    cityName: 'Ludhiana',
    businessDescription: null,
    addressLine: null,
    websiteUrl: null,
    showEmail: false,
    showPhone: false,
    completedAt: null,
    verificationStatus: 'NOT_SUBMITTED',
    verificationLevel: 'NONE',
    verificationSubmittedAt: null,
    verifiedAt: null,
    rejectionReason: null,
    verificationNote: null,
    user: { email: 'sam@example.com' },
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    const module = await Test.createTestingModule({
      providers: [PrismaEmployerProfileRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get(PrismaEmployerProfileRepository);
  });

  it('saves an incomplete draft with private contact settings', async () => {
    tx.employerProfile.findUnique.mockResolvedValue(null);
    tx.employerProfile.upsert.mockResolvedValue({
      ...profile,
      businessName: null,
      employerType: null,
    });
    await expect(repository.save('user-id', { cityName: 'Ludhiana' })).resolves.toMatchObject({
      businessName: null,
      showEmail: false,
      showPhone: false,
      completedAt: null,
    });
  });

  it('requires all minimum fields before completing a profile', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({ ...profile, employerType: null });
    await expect(repository.complete('user-id')).rejects.toBeInstanceOf(
      EmployerProfileIncompleteError,
    );
    expect(tx.employerProfile.update).not.toHaveBeenCalled();
  });

  it('completes a valid profile without changing verification status', async () => {
    const completedAt = new Date('2026-11-26T00:00:00.000Z');
    tx.employerProfile.findUnique.mockResolvedValue(profile);
    tx.employerProfile.update.mockResolvedValue({ ...profile, completedAt });
    await expect(repository.complete('user-id')).resolves.toMatchObject({
      completedAt: completedAt.toISOString(),
      verification: { verificationStatus: 'NOT_SUBMITTED' },
    });
  });

  it('blocks sensitive edits after verification submission', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({
      ...profile,
      verificationStatus: 'VERIFIED',
    });
    await expect(
      repository.save('user-id', { businessName: 'Another Shop' }),
    ).rejects.toBeInstanceOf(EmployerIdentityChangeConflictError);
    expect(tx.employerProfile.upsert).not.toHaveBeenCalled();
  });

  it('allows non-sensitive edits after verification submission', async () => {
    tx.employerProfile.findUnique.mockResolvedValue({
      ...profile,
      verificationStatus: 'VERIFIED',
    });
    tx.employerProfile.upsert.mockResolvedValue({
      ...profile,
      verificationStatus: 'VERIFIED',
      showEmail: true,
    });
    await expect(repository.save('user-id', { showEmail: true })).resolves.toMatchObject({
      showEmail: true,
      verification: { verificationStatus: 'VERIFIED' },
    });
  });
});

describe('EmployerProfileService', () => {
  it('maps incomplete profile errors to a client error', async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmployerProfileService,
        {
          provide: EmployerProfileRepository,
          useValue: { complete: vi.fn().mockRejectedValue(new EmployerProfileIncompleteError()) },
        },
      ],
    }).compile();
    const service = module.get(EmployerProfileService);
    await expect(service.complete('user-id')).rejects.toBeInstanceOf(BadRequestException);
  });
});
