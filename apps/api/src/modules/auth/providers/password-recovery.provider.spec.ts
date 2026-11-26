import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PasswordRecoveryRepository } from '@/modules/auth/repositories/password-recovery.repository.js';
import { PasswordProvider } from './password.provider.js';
import { PasswordRecoveryProvider } from './password-recovery.provider.js';
import { TokenProvider } from './token.provider.js';
import { VerificationMailProvider } from './verification-mail.provider.js';

describe('PasswordRecoveryProvider', () => {
  const recovery = {
    findEligibleAccount: vi.fn(),
    createResetToken: vi.fn(),
    resetPassword: vi.fn(),
  };
  const passwords = { hash: vi.fn() };
  const tokens = { createOpaqueToken: vi.fn(), hash: vi.fn() };
  const mail = { assertReady: vi.fn(), sendPasswordReset: vi.fn() };
  let provider: PasswordRecoveryProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PasswordRecoveryProvider,
        { provide: PasswordRecoveryRepository, useValue: recovery },
        { provide: PasswordProvider, useValue: passwords },
        { provide: TokenProvider, useValue: tokens },
        { provide: VerificationMailProvider, useValue: mail },
      ],
    }).compile();
    provider = module.get(PasswordRecoveryProvider);
    passwords.hash.mockResolvedValue('new-password-hash');
    tokens.hash.mockReturnValue('token-hash');
    tokens.createOpaqueToken.mockReturnValue('reset-token');
  });

  it('updates the password only after the repository consumes a valid token', async () => {
    recovery.resetPassword.mockResolvedValue(true);
    await provider.resetPassword({ token: 'reset-token', password: 'new-password' });

    expect(recovery.resetPassword).toHaveBeenCalledWith({
      tokenHash: 'token-hash',
      passwordHash: 'new-password-hash',
      now: expect.any(Date),
    });
  });

  it('rejects an expired or consumed reset token', async () => {
    recovery.resetPassword.mockResolvedValue(false);
    await expect(
      provider.resetPassword({ token: 'expired-token', password: 'new-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends the same generic response for an account not eligible for password recovery', async () => {
    recovery.findEligibleAccount.mockResolvedValue(null);
    await provider.requestReset({ email: 'user@example.com' });

    expect(recovery.createResetToken).not.toHaveBeenCalled();
    expect(mail.sendPasswordReset).toHaveBeenCalledWith('user@example.com', undefined);
  });
});
