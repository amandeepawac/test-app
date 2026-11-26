import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthAccountRepository } from '@/modules/auth/repositories/auth-account.repository.js';
import { EmailVerificationProvider } from './email-verification.provider.js';
import { TokenProvider } from './token.provider.js';

describe('EmailVerificationProvider', () => {
  const accounts = { verifyEmailToken: vi.fn() };
  const tokens = { hash: vi.fn() };
  let provider: EmailVerificationProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmailVerificationProvider,
        { provide: AuthAccountRepository, useValue: accounts },
        { provide: TokenProvider, useValue: tokens },
      ],
    }).compile();
    provider = module.get(EmailVerificationProvider);
    tokens.hash.mockReturnValue('token-hash');
  });

  it('passes only a token hash to the account repository', async () => {
    accounts.verifyEmailToken.mockResolvedValue(true);
    await provider.verify('plain-token');

    expect(accounts.verifyEmailToken).toHaveBeenCalledWith('token-hash', expect.any(Date));
  });

  it('rejects a used or expired verification token', async () => {
    accounts.verifyEmailToken.mockResolvedValue(false);
    await expect(provider.verify('invalid-token')).rejects.toBeInstanceOf(BadRequestException);
  });
});
