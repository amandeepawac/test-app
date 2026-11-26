import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { SessionResponse } from '@repo/contracts';
import { SessionRepository } from '@/modules/auth/repositories/session.repository.js';
import { TokenProvider } from './token.provider.js';
import { createSessionResponse } from './session-response.js';

@Injectable()
export class SessionProvider {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenProvider,
  ) {}

  async refresh(refreshToken: string): Promise<SessionResponse> {
    const tokenHash = this.tokens.hash(refreshToken);
    const owner = await this.sessions.findRefreshTokenOwner(tokenHash);
    if (!owner) throw new UnauthorizedException('Invalid session');

    const nextRefreshToken = this.tokens.createOpaqueToken();
    const accessToken = this.tokens.signAccess(owner.userId, owner.sessionId);
    const refreshExpiresIn = await this.sessions.rotateRefreshToken({
      tokenHash,
      nextTokenHash: this.tokens.hash(nextRefreshToken),
      owner,
      now: new Date(),
    });
    if (!refreshExpiresIn) throw new UnauthorizedException('Invalid session');

    return createSessionResponse(accessToken, nextRefreshToken, refreshExpiresIn);
  }

  async currentUser(accessToken: string) {
    const { userId, sessionId } = this.tokens.verifyAccess(accessToken);
    const user = await this.sessions.findCurrentUser(userId, sessionId, new Date());
    if (!user) throw new UnauthorizedException('Invalid session');
    return user;
  }

  logout(refreshToken: string): Promise<void> {
    return this.sessions.revokeByRefreshToken(this.tokens.hash(refreshToken), new Date());
  }
}
