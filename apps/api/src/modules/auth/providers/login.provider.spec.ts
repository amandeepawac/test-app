import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SessionRepository } from '@/modules/auth/repositories/session.repository.js';
import { LoginProvider } from './login.provider.js';
import { PasswordProvider } from './password.provider.js';
import { TokenProvider } from './token.provider.js';

describe('LoginProvider', () => {
  const sessions = {
    findLoginAccount: vi.fn(),
    createLoginSession: vi.fn(),
  };
  const passwords = { hash: vi.fn(), verify: vi.fn() };
  const tokens = {
    assertConfigured: vi.fn(),
    createOpaqueToken: vi.fn(),
    hash: vi.fn(),
    signAccess: vi.fn(),
  };
  let provider: LoginProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LoginProvider,
        { provide: SessionRepository, useValue: sessions },
        { provide: PasswordProvider, useValue: passwords },
        { provide: TokenProvider, useValue: tokens },
      ],
    }).compile();
    provider = module.get(LoginProvider);
    passwords.verify.mockResolvedValue(true);
    tokens.createOpaqueToken.mockReturnValue('refresh-token');
    tokens.hash.mockReturnValue('refresh-token-hash');
    tokens.signAccess.mockReturnValue('access-token');
    sessions.createLoginSession.mockResolvedValue('session-id');
  });

  it('creates a session only for an active, verified account with a matching password', async () => {
    sessions.findLoginAccount.mockResolvedValue({
      id: 'user-id',
      status: 'ACTIVE',
      deletedAt: null,
      emailVerifiedAt: new Date(),
      passwordCredential: { passwordHash: 'stored-hash' },
    });

    await expect(
      provider.login({ email: 'user@example.com', password: 'password' }),
    ).resolves.toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(sessions.createLoginSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        passwordHash: 'stored-hash',
        refreshTokenHash: 'refresh-token-hash',
      }),
    );
  });

  it('rejects an unverified account without creating a session', async () => {
    sessions.findLoginAccount.mockResolvedValue({
      id: 'user-id',
      status: 'ACTIVE',
      deletedAt: null,
      emailVerifiedAt: null,
      passwordCredential: { passwordHash: 'stored-hash' },
    });

    await expect(
      provider.login({ email: 'user@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.createLoginSession).not.toHaveBeenCalled();
  });
});
