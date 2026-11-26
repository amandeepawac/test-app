import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  type LoginAccount,
  type RefreshTokenOwner,
  SessionRepository,
} from './session.repository.js';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLoginAccount(email: string): Promise<LoginAccount | null> {
    return this.prisma.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        emailVerifiedAt: true,
        passwordCredential: { select: { passwordHash: true } },
      },
    });
  }

  async createLoginSession(input: {
    userId: string;
    passwordHash: string;
    refreshTokenHash: string;
    now: Date;
    expiresAt: Date;
  }): Promise<string | null> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${input.userId}::uuid FOR UPDATE`;
      const currentUser = await tx.user.findFirst({
        where: {
          id: input.userId,
          status: 'ACTIVE',
          deletedAt: null,
          emailVerifiedAt: { not: null },
          passwordCredential: { is: { passwordHash: input.passwordHash } },
        },
        select: { id: true },
      });
      if (!currentUser) return null;

      await tx.user.update({ where: { id: input.userId }, data: { lastLoginAt: input.now } });
      const session = await tx.authSession.create({
        data: {
          userId: input.userId,
          expiresAt: input.expiresAt,
          refreshTokens: {
            create: { tokenHash: input.refreshTokenHash, expiresAt: input.expiresAt },
          },
        },
        select: { id: true },
      });
      return session.id;
    });
  }

  findRefreshTokenOwner(tokenHash: string): Promise<RefreshTokenOwner | null> {
    return this.prisma.client.authRefreshToken
      .findUnique({
        where: { tokenHash },
        select: { sessionId: true, authSession: { select: { userId: true } } },
      })
      .then((token) =>
        token ? { sessionId: token.sessionId, userId: token.authSession.userId } : null,
      );
  }

  async rotateRefreshToken(input: {
    tokenHash: string;
    nextTokenHash: string;
    now: Date;
    owner: RefreshTokenOwner;
  }): Promise<number | null> {
    const db = this.prisma.client;

    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${input.owner.userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "auth_sessions" WHERE "id" = ${input.owner.sessionId}::uuid FOR UPDATE`;
      const token = await tx.authRefreshToken.findUnique({
        where: { tokenHash: input.tokenHash },
        include: { authSession: { include: { user: true } } },
      });
      if (!token) return null;

      const session = token.authSession;
      if (token.consumedAt) {
        await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: input.now },
        });
        return null;
      }

      const isInvalid =
        token.revokedAt ||
        token.expiresAt <= input.now ||
        session.revokedAt ||
        session.expiresAt <= input.now ||
        session.user.status !== 'ACTIVE' ||
        session.user.deletedAt ||
        !session.user.emailVerifiedAt;
      if (isInvalid) return null;

      const consumed = await tx.authRefreshToken.updateMany({
        where: {
          id: token.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: input.now },
        },
        data: { consumedAt: input.now },
      });
      if (consumed.count !== 1) {
        await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: input.now },
        });
        return null;
      }

      await tx.authSession.update({
        where: { id: session.id },
        data: { lastUsedAt: input.now },
      });
      await tx.authRefreshToken.create({
        data: {
          sessionId: session.id,
          tokenHash: input.nextTokenHash,
          expiresAt: session.expiresAt,
        },
      });
      return Math.max(1, Math.floor((session.expiresAt.getTime() - input.now.getTime()) / 1000));
    });
  }

  async findCurrentUser(userId: string, sessionId: string, now: Date) {
    const session = await this.prisma.client.authSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
        user: { status: 'ACTIVE', deletedAt: null, emailVerifiedAt: { not: null } },
      },
      select: { user: { select: { id: true, name: true, email: true } } },
    });
    return session?.user ?? null;
  }

  async revokeByRefreshToken(tokenHash: string, now: Date): Promise<void> {
    await this.prisma.client.authSession.updateMany({
      where: { refreshTokens: { some: { tokenHash } }, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
