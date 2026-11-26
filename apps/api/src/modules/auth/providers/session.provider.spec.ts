import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SessionRepository } from '@/modules/auth/repositories/session.repository.js';
import { SessionProvider } from './session.provider.js';
import { TokenProvider } from './token.provider.js';

describe('SessionProvider', () => {
  const sessions = {
    findLoginAccount: vi.fn(),
    createLoginSession: vi.fn(),
    findRefreshTokenOwner: vi.fn(),
    rotateRefreshToken: vi.fn(),
    findCurrentUser: vi.fn(),
    revokeByRefreshToken: vi.fn(),
  };
  const tokens = {
    createOpaqueToken: vi.fn(),
    hash: vi.fn(),
    signAccess: vi.fn(),
    verifyAccess: vi.fn(),
  };
  let provider: SessionProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SessionProvider,
        { provide: SessionRepository, useValue: sessions },
        { provide: TokenProvider, useValue: tokens },
      ],
    }).compile();
    provider = module.get(SessionProvider);
    tokens.hash.mockImplementation((token: string) => `hash:${token}`);
    tokens.signAccess.mockReturnValue('access-token');
    tokens.createOpaqueToken.mockReturnValue('next-refresh-token');
  });

  it('rotates a valid refresh token and returns a new session response', async () => {
    sessions.findRefreshTokenOwner.mockResolvedValue({
      userId: 'user-id',
      sessionId: 'session-id',
    });
    sessions.rotateRefreshToken.mockResolvedValue(120);

    await expect(provider.refresh('old-refresh-token')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token',
      accessExpiresIn: 900,
      refreshExpiresIn: 120,
    });
    expect(sessions.rotateRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: 'hash:old-refresh-token',
        nextTokenHash: 'hash:next-refresh-token',
        owner: { userId: 'user-id', sessionId: 'session-id' },
        now: expect.any(Date),
      }),
    );
  });

  it('rejects invalid or reused refresh tokens', async () => {
    sessions.findRefreshTokenOwner.mockResolvedValue({
      userId: 'user-id',
      sessionId: 'session-id',
    });
    sessions.rotateRefreshToken.mockResolvedValue(null);

    await expect(provider.refresh('reused-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes the session associated with the refresh token hash', async () => {
    await provider.logout('refresh-token');
    expect(sessions.revokeByRefreshToken).toHaveBeenCalledWith(
      'hash:refresh-token',
      expect.any(Date),
    );
  });
});
