import { BadRequestException, Injectable } from '@nestjs/common';
import type { ForgotPasswordRequest, ResetPasswordRequest } from '@repo/contracts';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { VerificationMailService } from './verification-mail.service.js';

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly mail: VerificationMailService,
  ) {}

  async requestReset(input: ForgotPasswordRequest): Promise<void> {
    this.mail.getSettings();
    const db = this.prisma.client;
    const user = await db.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        emailVerifiedAt: true,
        passwordCredential: { select: { id: true } },
      },
    });
    let token: string | undefined;
    if (
      user &&
      user.status === 'ACTIVE' &&
      !user.deletedAt &&
      user.emailVerifiedAt &&
      user.passwordCredential
    ) {
      token = this.tokens.createOpaqueToken();
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.tokens.hash(token),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    }
    await this.mail.sendPasswordReset(input.email, token);
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const db = this.prisma.client;
    const tokenHash = this.tokens.hash(input.token);
    const passwordHash = await this.passwords.hash(input.password);
    await db.$transaction(async (tx) => {
      const candidate = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });
      if (!candidate) throw new BadRequestException('Invalid or expired reset link');
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${candidate.userId}::uuid FOR UPDATE`;
      const now = new Date();
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: now },
          user: {
            status: 'ACTIVE',
            deletedAt: null,
            emailVerifiedAt: { not: null },
            passwordCredential: { isNot: null },
          },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) throw new BadRequestException('Invalid or expired reset link');
      await tx.passwordCredential.update({
        where: { userId: candidate.userId },
        data: { passwordHash, passwordChangedAt: now },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: candidate.userId, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.authSession.updateMany({
        where: { userId: candidate.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });
  }
}
