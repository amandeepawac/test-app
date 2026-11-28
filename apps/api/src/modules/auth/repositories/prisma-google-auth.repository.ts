import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  GoogleAuthRepository,
  type GoogleIdentity,
  type GoogleAuthMode,
} from './google-auth.repository.js';

type AuthInput = {
  identity: GoogleIdentity;
  intent: GoogleAuthMode;
  linkSession?: { userId: string; sessionId: string };
  refreshTokenHash: string;
  now: Date;
  expiresAt: Date;
};

@Injectable()
export class PrismaGoogleAuthRepository implements GoogleAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(input: AuthInput): Promise<{ userId: string; sessionId: string } | null> {
    try {
      return await this.authenticateOnce(input);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
      return this.authenticateOnce(input);
    }
  }

  private authenticateOnce(input: AuthInput) {
    return this.prisma.client.$transaction(async (tx) => {
      const { identity, intent, now } = input;
      const provider = await tx.userAuthProvider.findUnique({
        where: {
          provider_providerUserId: { provider: 'GOOGLE', providerUserId: identity.subject },
        },
        select: { userId: true },
      });
      let userId = provider?.userId;

      if (intent.mode === 'link') {
        const owner = input.linkSession;
        if (!owner || (userId && userId !== owner.userId)) return null;
        await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${owner.userId}::uuid FOR UPDATE`;
        const session = await tx.authSession.findFirst({
          where: {
            id: owner.sessionId,
            userId: owner.userId,
            revokedAt: null,
            expiresAt: { gt: now },
            user: {
              status: 'ACTIVE',
              deletedAt: null,
              emailVerifiedAt: { not: null },
              email: identity.email,
              primaryRole: { in: ['JOB_SEEKER', 'EMPLOYER'] },
            },
          },
          select: { id: true },
        });
        if (!session) return null;
        const existing = await tx.userAuthProvider.findUnique({
          where: { userId_provider: { userId: owner.userId, provider: 'GOOGLE' } },
          select: { providerUserId: true },
        });
        if (existing && existing.providerUserId !== identity.subject) return null;
        if (!existing) {
          await tx.userAuthProvider.create({
            data: { userId: owner.userId, provider: 'GOOGLE', providerUserId: identity.subject },
          });
        }
        return { userId: owner.userId, sessionId: owner.sessionId };
      }

      if (!userId) {
        if (intent.mode !== 'signup' || !intent.role) return null;
        const existing = await tx.user.findUnique({
          where: { email: identity.email },
          select: { id: true },
        });
        if (existing) return null;
        const user = await tx.user.create({
          data: {
            email: identity.email,
            name: identity.name,
            primaryRole: intent.role,
            emailVerifiedAt: now,
            status: 'ACTIVE',
            authProviders: { create: { provider: 'GOOGLE', providerUserId: identity.subject } },
          },
          select: { id: true },
        });
        userId = user.id;
      }
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      const account = await tx.user.findFirst({
        where: {
          id: userId,
          status: 'ACTIVE',
          deletedAt: null,
          emailVerifiedAt: { not: null },
          primaryRole: { in: ['JOB_SEEKER', 'EMPLOYER'] },
          authProviders: { some: { provider: 'GOOGLE', providerUserId: identity.subject } },
        },
        select: { id: true },
      });
      if (!account) return null;
      await tx.user.update({ where: { id: userId }, data: { lastLoginAt: now } });
      const session = await tx.authSession.create({
        data: {
          userId,
          expiresAt: input.expiresAt,
          refreshTokens: {
            create: { tokenHash: input.refreshTokenHash, expiresAt: input.expiresAt },
          },
        },
        select: { id: true },
      });
      return { userId, sessionId: session.id };
    });
  }
}
