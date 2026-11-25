import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RegistrationRequest } from '@repo/contracts';
import { Prisma } from '@repo/db/generated';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordService } from './password.service.js';
import { VerificationMailService } from './verification-mail.service.js';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly mail: VerificationMailService,
  ) {}

  async register(input: RegistrationRequest): Promise<void> {
    this.mail.getSettings();
    const passwordHash = await this.passwords.hash(input.password);
    const db = this.prisma.client;
    let user = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true, emailVerifiedAt: true, status: true },
    });

    if (!user) {
      const id = randomUUID();
      try {
        user = await db.user.create({
          data: {
            id,
            email: input.email,
            name: input.name,
            passwordCredential: { create: { passwordHash } },
            authProviders: { create: { provider: 'EMAIL_PASSWORD', providerUserId: id } },
          },
          select: { id: true, emailVerifiedAt: true, status: true },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
          throw error;
        }
        user = await db.user.findUnique({
          where: { email: input.email },
          select: { id: true, emailVerifiedAt: true, status: true },
        });
        if (!user) throw error;
      }
    }

    let token: string | undefined;
    if (!user.emailVerifiedAt && (user.status === 'ACTIVE' || user.status === 'PENDING')) {
      token = randomBytes(32).toString('base64url');
      await db.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          pendingPasswordHash: passwordHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }
    await this.mail.send(input.email, token);
  }

  async verifyEmail(token: string): Promise<void> {
    const db = this.prisma.client;
    const tokenHash = this.hashToken(token);
    await db.$transaction(async (tx) => {
      const now = new Date();
      const verification = await tx.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: now },
          pendingPasswordHash: { not: null },
        },
        select: { userId: true, pendingPasswordHash: true },
      });
      if (!verification?.pendingPasswordHash) {
        throw new BadRequestException('Invalid or expired verification link');
      }
      const verified = await tx.user.updateMany({
        where: {
          id: verification.userId,
          emailVerifiedAt: null,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
        data: { emailVerifiedAt: now, status: 'ACTIVE' },
      });
      if (verified.count !== 1) {
        throw new BadRequestException('Invalid or expired verification link');
      }
      const consumed = await tx.emailVerificationToken.updateMany({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException('Invalid or expired verification link');
      }
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
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
