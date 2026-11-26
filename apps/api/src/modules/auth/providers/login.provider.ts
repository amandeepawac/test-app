import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { LoginRequest, SessionResponse } from '@repo/contracts';
import {
  SessionRepository,
  type LoginAccount,
} from '@/modules/auth/repositories/session.repository.js';
import { PasswordProvider } from './password.provider.js';
import { SESSION_TTL_SECONDS, TokenProvider } from './token.provider.js';
import { createSessionResponse } from './session-response.js';

@Injectable()
export class LoginProvider {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly passwords: PasswordProvider,
    private readonly tokens: TokenProvider,
  ) {}

  async login(input: LoginRequest): Promise<SessionResponse> {
    const account = await this.sessions.findLoginAccount(input.email);
    const passwordHash = account?.passwordCredential?.passwordHash;
    const passwordMatches = passwordHash
      ? await this.passwords.verify(passwordHash, input.password)
      : (await this.passwords.hash(input.password), false);

    if (!passwordHash || !this.canSignIn(account, passwordMatches)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.tokens.assertConfigured();
    const refreshToken = this.tokens.createOpaqueToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
    const sessionId = await this.sessions.createLoginSession({
      userId: account.id,
      passwordHash,
      refreshTokenHash: this.tokens.hash(refreshToken),
      now,
      expiresAt,
    });
    if (!sessionId) throw new UnauthorizedException('Invalid email or password');

    const accessToken = this.tokens.signAccess(account.id, sessionId);
    return createSessionResponse(accessToken, refreshToken, SESSION_TTL_SECONDS);
  }

  private canSignIn(
    account: LoginAccount | null,
    passwordMatches: boolean,
  ): account is LoginAccount {
    return Boolean(
      passwordMatches &&
      account &&
      account.status === 'ACTIVE' &&
      !account.deletedAt &&
      account.emailVerifiedAt,
    );
  }
}
