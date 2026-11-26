import { BadRequestException, Injectable } from '@nestjs/common';
import type { ForgotPasswordRequest, ResetPasswordRequest } from '@repo/contracts';
import { PasswordRecoveryRepository } from '@/modules/auth/repositories/password-recovery.repository.js';
import { PasswordProvider } from './password.provider.js';
import { TokenProvider } from './token.provider.js';
import { VerificationMailProvider } from './verification-mail.provider.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PasswordRecoveryProvider {
  constructor(
    private readonly passwordRecovery: PasswordRecoveryRepository,
    private readonly passwords: PasswordProvider,
    private readonly tokens: TokenProvider,
    private readonly mail: VerificationMailProvider,
  ) {}

  async requestReset(input: ForgotPasswordRequest): Promise<void> {
    this.mail.assertReady();
    const account = await this.passwordRecovery.findEligibleAccount(input.email);
    const resetToken = account ? this.tokens.createOpaqueToken() : undefined;

    if (account && resetToken) {
      await this.passwordRecovery.createResetToken({
        userId: account.id,
        tokenHash: this.tokens.hash(resetToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });
    }

    await this.mail.sendPasswordReset(input.email, resetToken);
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const didReset = await this.passwordRecovery.resetPassword({
      tokenHash: this.tokens.hash(input.token),
      passwordHash: await this.passwords.hash(input.password),
      now: new Date(),
    });
    if (!didReset) throw new BadRequestException('Invalid or expired reset link');
  }
}
