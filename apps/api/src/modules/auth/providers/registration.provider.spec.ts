import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { AuthAccountRepository } from '@/modules/auth/repositories/auth-account.repository.js';
import { PasswordProvider } from './password.provider.js';
import { RegistrationProvider } from './registration.provider.js';
import { TokenProvider } from './token.provider.js';
import { VerificationMailProvider } from './verification-mail.provider.js';

describe('RegistrationProvider', () => {
  const account = { id: 'user-id', emailVerifiedAt: null, status: 'ACTIVE' };
  const accounts = {
    findOrCreateRegistrationAccount: vi.fn(),
    createVerificationToken: vi.fn(),
    verifyEmailToken: vi.fn(),
  };
  const passwords = { hash: vi.fn() };
  const tokens = {
    hash: vi.fn((token: string) => createHash('sha256').update(token).digest('hex')),
  };
  const mail = { assertReady: vi.fn(), send: vi.fn() };
  let provider: RegistrationProvider;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RegistrationProvider,
        { provide: AuthAccountRepository, useValue: accounts },
        { provide: PasswordProvider, useValue: passwords },
        { provide: TokenProvider, useValue: tokens },
        { provide: VerificationMailProvider, useValue: mail },
      ],
    }).compile();
    provider = module.get(RegistrationProvider);
    passwords.hash.mockResolvedValue('password-hash');
    accounts.findOrCreateRegistrationAccount.mockResolvedValue(account);
    mail.send.mockResolvedValue(undefined);
  });

  it('stores only a hashed verification token for a newly registered account', async () => {
    await provider.register({
      name: 'Example',
      email: 'user@example.com',
      password: 'password123',
    });

    expect(accounts.findOrCreateRegistrationAccount).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'Example',
      passwordHash: 'password-hash',
      role: 'JOB_SEEKER',
    });
    const token = mail.send.mock.calls[0]?.[1];
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(accounts.createVerificationToken).toHaveBeenCalledWith({
      userId: account.id,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      pendingPasswordHash: 'password-hash',
      expiresAt: expect.any(Date),
    });
  });

  it('passes the chosen employer role when registering', async () => {
    await provider.register({
      name: 'Example',
      email: 'user@example.com',
      password: 'password123',
      role: 'EMPLOYER',
    });
    expect(accounts.findOrCreateRegistrationAccount).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'EMPLOYER' }),
    );
  });

  it('does not issue another verification token for a verified account', async () => {
    accounts.findOrCreateRegistrationAccount.mockResolvedValue({
      ...account,
      emailVerifiedAt: new Date(),
    });
    await provider.register({
      name: 'Example',
      email: 'user@example.com',
      password: 'password123',
    });

    expect(accounts.createVerificationToken).not.toHaveBeenCalled();
    expect(mail.send).toHaveBeenCalledWith('user@example.com', undefined);
  });
});
