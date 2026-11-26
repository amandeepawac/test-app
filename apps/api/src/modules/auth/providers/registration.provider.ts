import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { RegistrationRequest } from '@repo/contracts';
import { AuthAccountRepository } from '@/modules/auth/repositories/auth-account.repository.js';
import { PasswordProvider } from './password.provider.js';
import { TokenProvider } from './token.provider.js';
import { VerificationMailProvider } from './verification-mail.provider.js';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RegistrationProvider {
  constructor(
    private readonly accounts: AuthAccountRepository,
    private readonly passwords: PasswordProvider,
    private readonly tokens: TokenProvider,
    private readonly mail: VerificationMailProvider,
  ) {}

  async register(input: RegistrationRequest): Promise<void> {
    this.mail.assertReady();
    const passwordHash = await this.passwords.hash(input.password);
    const account = await this.accounts.findOrCreateRegistrationAccount({
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role ?? 'JOB_SEEKER',
    });

    const verificationToken = this.createVerificationTokenIfEligible(account);
    if (verificationToken) {
      await this.accounts.createVerificationToken({
        userId: account.id,
        tokenHash: this.tokens.hash(verificationToken),
        pendingPasswordHash: passwordHash,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      });
    }

    await this.mail.send(input.email, verificationToken);
  }

  private createVerificationTokenIfEligible(account: {
    emailVerifiedAt: Date | null;
    status: string;
  }): string | undefined {
    if (account.emailVerifiedAt || !['ACTIVE', 'PENDING'].includes(account.status)) {
      return undefined;
    }
    return randomBytes(32).toString('base64url');
  }
}
