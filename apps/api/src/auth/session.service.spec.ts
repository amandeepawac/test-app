import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { TokenService } from './token.service.js';

describe('SessionService', () => {
  const tx = {
    $queryRaw: vi.fn(),
    user: { findFirst: vi.fn(), update: vi.fn() },
    authSession: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    authRefreshToken: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  };
  const db = {
    user: { findUnique: vi.fn() },
    authRefreshToken: { findUnique: vi.fn() },
    authSession: { updateMany: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const passwords = { hash: vi.fn(), verify: vi.fn() };
  const tokens = { createOpaqueToken: vi.fn(), hash: vi.fn(), signAccess: vi.fn(), verifyAccess: vi.fn() };
  let service: SessionService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: { client: db } },
        { provide: PasswordService, useValue: passwords },
        { provide: TokenService, useValue: tokens },
      ],
    }).compile();
    service = module.get(SessionService);
    tokens.hash.mockReturnValue('hash');
    tokens.signAccess.mockReturnValue('access');
    tokens.createOpaqueToken.mockReturnValue('next-token');
    tx.user.findFirst.mockResolvedValue({ id: 'user-id' });
    tx.authRefreshToken.updateMany.mockResolvedValue({ count: 1 });
  });

  it('refuses login for an unverified account', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'user-id', status: 'ACTIVE', deletedAt: null, emailVerifiedAt: null,
      passwordCredential: { passwordHash: 'hash' },
    });

    it('refuses login if the password changed after it was verified', async () => {
      db.user.findUnique.mockResolvedValue({
        id: 'user-id', status: 'ACTIVE', deletedAt: null, emailVerifiedAt: new Date(),
        passwordCredential: { passwordHash: 'old-hash' },
      });
      passwords.verify.mockResolvedValue(true);
      tx.user.findFirst.mockResolvedValue(null);
      await expect(service.login({ email: 'user@example.com', password: 'password' }))
        .rejects.toBeInstanceOf(UnauthorizedException);
      expect(tx.authSession.create).not.toHaveBeenCalled();
    });
    passwords.verify.mockResolvedValue(true);
    await expect(service.login({ email: 'user@example.com', password: 'password' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it('rotates a valid token and revokes the session on reuse', async () => {
    db.authRefreshToken.findUnique.mockResolvedValue({ sessionId: 'session-id', authSession: { userId: 'user-id' } });
    const session = {
      id: 'session-id', revokedAt: null, expiresAt: new Date(Date.now() + 60_000),
      user: { status: 'ACTIVE', deletedAt: null, emailVerifiedAt: new Date() },
    };
    tx.authRefreshToken.findUnique
      .mockResolvedValueOnce({ id: 'token-id', consumedAt: null, revokedAt: null, expiresAt: session.expiresAt, authSession: session })
      .mockResolvedValueOnce({ id: 'token-id', consumedAt: new Date(), authSession: session });
    await expect(service.refresh('old-token')).resolves.toMatchObject({ refreshToken: 'next-token' });
    expect(tx.authRefreshToken.create).toHaveBeenCalledOnce();
    await expect(service.refresh('old-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-id', revokedAt: null }, data: { revokedAt: expect.any(Date) },
    });
  });

  it('revokes the session associated with a logout token', async () => {
    await service.logout('token');
    expect(db.authSession.updateMany).toHaveBeenCalledWith({
      where: { refreshTokens: { some: { tokenHash: 'hash' } }, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
