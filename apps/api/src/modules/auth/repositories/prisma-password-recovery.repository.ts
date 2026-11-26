import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { PasswordRecoveryRepository } from './password-recovery.repository.js';

@Injectable()
export class PrismaPasswordRecoveryRepository implements PasswordRecoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEligibleAccount(email: string): Promise<{ id: string } | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        emailVerifiedAt: true,
        passwordCredential: { select: { id: true } },
      },
    });
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.deletedAt ||
      !user.emailVerifiedAt ||
      !user.passwordCredential
    ) {
      return null;
    }
    return { id: user.id };
  }

  async createResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.client.passwordResetToken.create({ data: input });
  }

  async resetPassword(input: {
    tokenHash: string;
    passwordHash: string;
    now: Date;
  }): Promise<boolean> {
    return this.prisma.client.$transaction(async (tx) => {
      const candidate = await tx.passwordResetToken.findUnique({
        where: { tokenHash: input.tokenHash },
        select: { userId: true },
      });
      if (!candidate) return false;

      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${candidate.userId}::uuid FOR UPDATE`;
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash: input.tokenHash,
          consumedAt: null,
          expiresAt: { gt: input.now },
          user: {
            status: 'ACTIVE',
            deletedAt: null,
            emailVerifiedAt: { not: null },
            passwordCredential: { isNot: null },
          },
        },
        data: { consumedAt: input.now },
      });
      if (consumed.count !== 1) return false;

      await tx.passwordCredential.update({
        where: { userId: candidate.userId },
        data: { passwordHash: input.passwordHash, passwordChangedAt: input.now },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: candidate.userId, consumedAt: null },
        data: { consumedAt: input.now },
      });
      await tx.authSession.updateMany({
        where: { userId: candidate.userId, revokedAt: null },
        data: { revokedAt: input.now },
      });
      return true;
    });
  }
}
