import { Test } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { PrismaGoogleAuthRepository } from './prisma-google-auth.repository.js';

describe('PrismaGoogleAuthRepository', () => {
  const tx = {
    $queryRaw: vi.fn(),
    userAuthProvider: { findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    authSession: { findFirst: vi.fn(), create: vi.fn() },
  };
  const prisma = { client: { $transaction: vi.fn() } };
  const base = {
    identity: { subject: 'sub', email: 'user@example.com', name: 'User' },
    refreshTokenHash: 'hash', now: new Date(), expiresAt: new Date(),
  };
  let repository: PrismaGoogleAuthRepository;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((fn) => fn(tx));
    tx.user.findFirst.mockResolvedValue({ id: 'user-id' });
    tx.user.create.mockResolvedValue({ id: 'user-id' });
    tx.authSession.create.mockResolvedValue({ id: 'new-session' });
    const module = await Test.createTestingModule({
      providers: [PrismaGoogleAuthRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get(PrismaGoogleAuthRepository);
  });

  it('creates new users with the selected role and Google identity atomically', async () => {
    tx.userAuthProvider.findUnique.mockResolvedValue(null);
    tx.user.findUnique.mockResolvedValue(null);
    await expect(repository.authenticate({ ...base, intent: { mode: 'signup', role: 'EMPLOYER' } }))
      .resolves.toEqual({ userId: 'user-id', sessionId: 'new-session' });
    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ primaryRole: 'EMPLOYER', emailVerifiedAt: base.now,
        authProviders: { create: { provider: 'GOOGLE', providerUserId: 'sub' } } }),
    }));
  });

  it('never links an existing email implicitly', async () => {
    tx.userAuthProvider.findUnique.mockResolvedValue(null);
    tx.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(repository.authenticate({ ...base, intent: { mode: 'signup', role: 'EMPLOYER' } })).resolves.toBeNull();
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it('signs in linked identities without altering their existing role', async () => {
    tx.userAuthProvider.findUnique.mockResolvedValue({ userId: 'user-id' });
    await expect(repository.authenticate({ ...base, intent: { mode: 'signup', role: 'EMPLOYER' } }))
      .resolves.toEqual({ userId: 'user-id', sessionId: 'new-session' });
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'user-id' }, data: { lastLoginAt: base.now } });
  });

  it('does not create accounts from the login flow or issue sessions to inactive users', async () => {
    tx.userAuthProvider.findUnique.mockResolvedValue(null);
    await expect(repository.authenticate({ ...base, intent: { mode: 'login' } })).resolves.toBeNull();
    expect(tx.user.create).not.toHaveBeenCalled();
    tx.userAuthProvider.findUnique.mockResolvedValue({ userId: 'user-id' });
    tx.user.findFirst.mockResolvedValue(null);
    await expect(repository.authenticate({ ...base, intent: { mode: 'login' } })).resolves.toBeNull();
    expect(tx.authSession.create).not.toHaveBeenCalled();
    expect(tx.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'ACTIVE', deletedAt: null, emailVerifiedAt: { not: null } }),
    }));
  });

  it('requires a valid session and matching verified email to link', async () => {
    tx.userAuthProvider.findUnique.mockResolvedValue(null);
    tx.authSession.findFirst.mockResolvedValue({ id: 'session' });
    await expect(repository.authenticate({
      ...base, intent: { mode: 'link' }, linkSession: { userId: 'user-id', sessionId: 'session' },
    })).resolves.toEqual({ userId: 'user-id', sessionId: 'session' });
    expect(tx.authSession.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'session', user: expect.objectContaining({ email: 'user@example.com' }) }),
    }));
    expect(tx.userAuthProvider.create).toHaveBeenCalled();
    expect(tx.authSession.create).not.toHaveBeenCalled();
    tx.authSession.findFirst.mockResolvedValue(null);
    tx.userAuthProvider.create.mockClear();
    await expect(repository.authenticate({
      ...base, intent: { mode: 'link' }, linkSession: { userId: 'user-id', sessionId: 'session' },
    })).resolves.toBeNull();
    expect(tx.userAuthProvider.create).not.toHaveBeenCalled();
  });

  it('refuses to link a Google identity owned by another user', async () => {
    tx.userAuthProvider.findUnique.mockResolvedValue({ userId: 'other' });
    await expect(repository.authenticate({
      ...base, intent: { mode: 'link' }, linkSession: { userId: 'user-id', sessionId: 'session' },
    })).resolves.toBeNull();
    expect(tx.userAuthProvider.create).not.toHaveBeenCalled();
  });
});
