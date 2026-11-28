import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GoogleAuthRepository } from '../repositories/google-auth.repository.js';
import { GoogleIdentityProvider } from './google-identity.provider.js';
import { GoogleAuthProvider } from './google-auth.provider.js';
import { TokenProvider } from './token.provider.js';

describe('GoogleAuthProvider', () => {
  const identity = { subject: 'google-sub', email: 'user@example.com', name: 'User' };
  const google = { verify: vi.fn() };
  const accounts = { authenticate: vi.fn() };
  const tokens = {
    assertConfigured: vi.fn(),
    verifyAccess: vi.fn(),
    createOpaqueToken: vi.fn(),
    hash: vi.fn(),
    signAccess: vi.fn(),
  };
  const exchange = { code: 'code', codeVerifier: 'a'.repeat(43), nonce: 'b'.repeat(43) };
  let provider: GoogleAuthProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    google.verify.mockResolvedValue(identity);
    accounts.authenticate.mockResolvedValue({ userId: 'user-id', sessionId: 'session-id' });
    tokens.createOpaqueToken.mockReturnValue('refresh');
    tokens.hash.mockReturnValue('refresh-hash');
    tokens.signAccess.mockReturnValue('access');
    tokens.verifyAccess.mockReturnValue({ userId: 'user-id', sessionId: 'session-id' });
    const module = await Test.createTestingModule({
      providers: [
        GoogleAuthProvider,
        { provide: GoogleIdentityProvider, useValue: google },
        { provide: GoogleAuthRepository, useValue: accounts },
        { provide: TokenProvider, useValue: tokens },
      ],
    }).compile();
    provider = module.get(GoogleAuthProvider);
  });

  it('creates a session with the selected signup role and a hashed refresh token', async () => {
    await expect(
      provider.authenticate({ ...exchange, mode: 'signup', role: 'EMPLOYER' }),
    ).resolves.toMatchObject({ accessToken: 'access', refreshToken: 'refresh' });
    expect(accounts.authenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        identity,
        intent: { mode: 'signup', role: 'EMPLOYER' },
        refreshTokenHash: 'refresh-hash',
      }),
    );
  });

  it('requires an authenticated session for linking and does not create another session', async () => {
    await expect(
      provider.authenticate({ ...exchange, mode: 'link' }, 'Bearer access'),
    ).resolves.toEqual({ linked: true });
    expect(tokens.verifyAccess).toHaveBeenCalledWith('access');
    expect(accounts.authenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        linkSession: { userId: 'user-id', sessionId: 'session-id' },
      }),
    );
    expect(tokens.signAccess).not.toHaveBeenCalled();
  });

  it('rejects unknown identities and conflicts without returning a session', async () => {
    accounts.authenticate.mockResolvedValue(null);
    await expect(provider.authenticate({ ...exchange, mode: 'login' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokens.signAccess).not.toHaveBeenCalled();
  });
});
