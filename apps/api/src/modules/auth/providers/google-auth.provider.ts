import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { GoogleAuthRequest } from '@repo/contracts';
import { GoogleAuthRepository } from '../repositories/google-auth.repository.js';
import { GoogleIdentityProvider } from './google-identity.provider.js';
import { createSessionResponse } from './session-response.js';
import { SESSION_TTL_SECONDS, TokenProvider } from './token.provider.js';

@Injectable()
export class GoogleAuthProvider {
  constructor(
    private readonly google: GoogleIdentityProvider,
    private readonly accounts: GoogleAuthRepository,
    private readonly tokens: TokenProvider,
  ) {}

  async authenticate(input: GoogleAuthRequest, authorization?: string) {
    this.tokens.assertConfigured();
    const linkSession = input.mode === 'link'
      ? this.tokens.verifyAccess(authorization?.startsWith('Bearer ') ? authorization.slice(7) : '')
      : undefined;
    const identity = await this.google.verify(input);
    const refreshToken = this.tokens.createOpaqueToken();
    const now = new Date();
    const account = await this.accounts.authenticate({
      identity,
      intent: input.mode === 'signup' ? { mode: 'signup', role: input.role } : { mode: input.mode },
      linkSession,
      refreshTokenHash: this.tokens.hash(refreshToken),
      now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
    });
    if (!account) throw new UnauthorizedException('Google authentication failed');
    if (input.mode === 'link') return { linked: true } as const;
    return createSessionResponse(
      this.tokens.signAccess(account.userId, account.sessionId), refreshToken, SESSION_TTL_SECONDS,
    );
  }
}
