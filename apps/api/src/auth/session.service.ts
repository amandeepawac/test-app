import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { LoginRequest, SessionResponse } from '@repo/contracts';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordService } from './password.service.js';
import { ACCESS_TTL_SECONDS, SESSION_TTL_SECONDS, TokenService } from './token.service.js';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async login(input: LoginRequest): Promise<SessionResponse> {
    const db = this.prisma.client;
    const user = await db.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        emailVerifiedAt: true,
        passwordCredential: { select: { passwordHash: true } },
      },
    });
    const passwordHash = user?.passwordCredential?.passwordHash;
    const matches = passwordHash
      ? await this.passwords.verify(passwordHash, input.password)
      : (await this.passwords.hash(input.password), false);
    if (!matches || !user || !passwordHash || user.status !== 'ACTIVE' || user.deletedAt || !user.emailVerifiedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = randomUUID();
    const refreshToken = this.tokens.createOpaqueToken();
    const accessToken = this.tokens.signAccess(user.id, sessionId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
      const current = await tx.user.findFirst({
        where: {
          id: user.id,
          status: 'ACTIVE',
          deletedAt: null,
          emailVerifiedAt: { not: null },
          passwordCredential: { is: { passwordHash } },
        },
        select: { id: true },
      });
      if (!current) throw new UnauthorizedException('Invalid email or password');
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: now } });
      await tx.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          expiresAt,
          refreshTokens: {
            create: { tokenHash: this.tokens.hash(refreshToken), expiresAt },
          },
        },
      });
    });
    return this.response(accessToken, refreshToken, SESSION_TTL_SECONDS);
  }

  async refresh(refreshToken: string): Promise<SessionResponse> {
    const db = this.prisma.client;
    const tokenHash = this.tokens.hash(refreshToken);
    const existing = await db.authRefreshToken.findUnique({
      where: { tokenHash },
      select: { sessionId: true, authSession: { select: { userId: true } } },
    });
    if (!existing) throw new UnauthorizedException('Invalid session');
    const nextToken = this.tokens.createOpaqueToken();
    const accessToken = this.tokens.signAccess(existing.authSession.userId, existing.sessionId);
    const result = await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${existing.authSession.userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "auth_sessions" WHERE "id" = ${existing.sessionId}::uuid FOR UPDATE`;
      const current = await tx.authRefreshToken.findUnique({
        where: { tokenHash },
        include: { authSession: { include: { user: true } } },
      });
      if (!current) return null;
      const session = current.authSession;
      if (current.consumedAt) {
        await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: now },
        });
        return null;
      }
      if (
        current.revokedAt ||
        current.expiresAt <= now ||
        session.revokedAt ||
        session.expiresAt <= now ||
        session.user.status !== 'ACTIVE' ||
        session.user.deletedAt ||
        !session.user.emailVerifiedAt
      ) return null;

      const consumed = await tx.authRefreshToken.updateMany({
        where: { id: current.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: now },
        });
        return null;
      }
      await tx.authSession.update({ where: { id: session.id }, data: { lastUsedAt: now } });
      await tx.authRefreshToken.create({
        data: {
          sessionId: session.id,
          tokenHash: this.tokens.hash(nextToken),
          expiresAt: session.expiresAt,
        },
      });
      return Math.max(1, Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000));
    });
    if (!result) throw new UnauthorizedException('Invalid session');
    return this.response(accessToken, nextToken, result);
  }

  async currentUser(accessToken: string) {
    const { userId, sessionId } = this.tokens.verifyAccess(accessToken);
    const session = await this.prisma.client.authSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: 'ACTIVE', deletedAt: null, emailVerifiedAt: { not: null } },
      },
      select: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!session) throw new UnauthorizedException('Invalid session');
    return session.user;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.client.authSession.updateMany({
      where: { refreshTokens: { some: { tokenHash: this.tokens.hash(refreshToken) } }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private response(accessToken: string, refreshToken: string, refreshExpiresIn: number): SessionResponse {
    return { accessToken, refreshToken, accessExpiresIn: ACCESS_TTL_SECONDS, refreshExpiresIn };
  }
}
