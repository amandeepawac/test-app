import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordService } from './password.service.js';
import { PasswordRecoveryService } from './password-recovery.service.js';
import { TokenService } from './token.service.js';
import { VerificationMailService } from './verification-mail.service.js';

describe('PasswordRecoveryService', () => {
  const tx = {
    $queryRaw: vi.fn(),
    passwordResetToken: { findUnique: vi.fn(), updateMany: vi.fn() },
    passwordCredential: { update: vi.fn() },
    authSession: { updateMany: vi.fn() },
  };
  const db = { $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx)) };
  const passwords = { hash: vi.fn() };
  const tokens = { hash: vi.fn() };
  let service: PasswordRecoveryService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PasswordRecoveryService,
        { provide: PrismaService, useValue: { client: db } },
        { provide: PasswordService, useValue: passwords },
        { provide: TokenService, useValue: tokens },
        { provide: VerificationMailService, useValue: {} },
      ],
    }).compile();
    service = module.get(PasswordRecoveryService);
    passwords.hash.mockResolvedValue('new-hash');
    tokens.hash.mockReturnValue('token-hash');
    tx.passwordResetToken.findUnique.mockResolvedValue({ userId: 'user-id' });
  });

  it('consumes reset links, updates the password and revokes sessions', async () => {
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    await service.resetPassword({ token: 'token', password: 'new-password' });
    expect(tx.passwordCredential.update).toHaveBeenCalledWith({
      where: { userId: 'user-id' }, data: { passwordHash: 'new-hash', passwordChangedAt: expect.any(Date) },
    });
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', revokedAt: null }, data: { revokedAt: expect.any(Date) },
    });
  });

  it('rejects a consumed or expired reset token without changing credentials', async () => {
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.resetPassword({ token: 'token', password: 'new-password' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(tx.passwordCredential.update).not.toHaveBeenCalled();
    expect(tx.authSession.updateMany).not.toHaveBeenCalled();
  });
});
