import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AuthAccountRepository, type RegistrationAccount } from './auth-account.repository.js';

class InvalidVerificationTokenError extends Error {}

@Injectable()
export class PrismaAuthAccountRepository implements AuthAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateRegistrationAccount(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<RegistrationAccount> {
    const db = this.prisma.client;
    const existing = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true, emailVerifiedAt: true, status: true },
    });
    if (existing) return existing;

    try {
      return await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            passwordCredential: { create: { passwordHash: input.passwordHash } },
          },
          select: { id: true, emailVerifiedAt: true, status: true },
        });
        await tx.userAuthProvider.create({
          data: {
            userId: user.id,
            provider: 'EMAIL_PASSWORD',
            providerUserId: user.id,
          },
        });
        return user;
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }

      const concurrentAccount = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true, emailVerifiedAt: true, status: true },
      });
      if (!concurrentAccount) throw error;
      return concurrentAccount;
    }
  }

  async createVerificationToken(input: {
    userId: string;
    tokenHash: string;
    pendingPasswordHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.client.emailVerificationToken.create({ data: input });
  }

  async verifyEmailToken(tokenHash: string, now: Date): Promise<boolean> {
    try {
      await this.prisma.client.$transaction(async (tx) => {
        const verification = await tx.emailVerificationToken.findFirst({
          where: {
            tokenHash,
            consumedAt: null,
            expiresAt: { gt: now },
            pendingPasswordHash: { not: null },
          },
          select: { userId: true, pendingPasswordHash: true },
        });
        if (!verification?.pendingPasswordHash) throw new InvalidVerificationTokenError();

        const verified = await tx.user.updateMany({
          where: {
            id: verification.userId,
            emailVerifiedAt: null,
            status: { in: ['ACTIVE', 'PENDING'] },
          },
          data: { emailVerifiedAt: now, status: 'ACTIVE' },
        });
        if (verified.count !== 1) throw new InvalidVerificationTokenError();

        const consumed = await tx.emailVerificationToken.updateMany({
          where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
          data: { consumedAt: now },
        });
        if (consumed.count !== 1) throw new InvalidVerificationTokenError();

        await tx.passwordCredential.upsert({
          where: { userId: verification.userId },
          create: { userId: verification.userId, passwordHash: verification.pendingPasswordHash },
          update: { passwordHash: verification.pendingPasswordHash, passwordChangedAt: now },
        });
        await tx.userAuthProvider.upsert({
          where: { userId_provider: { userId: verification.userId, provider: 'EMAIL_PASSWORD' } },
          create: {
            userId: verification.userId,
            provider: 'EMAIL_PASSWORD',
            providerUserId: verification.userId,
          },
          update: {},
        });
        await tx.emailVerificationToken.updateMany({
          where: { userId: verification.userId },
          data: { consumedAt: now, pendingPasswordHash: null },
        });
      });
      return true;
    } catch (error) {
      if (error instanceof InvalidVerificationTokenError) return false;
      throw error;
    }
  }
}
