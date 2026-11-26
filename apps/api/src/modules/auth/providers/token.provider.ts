import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const UUID_SCHEMA = z.uuid();

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  createOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  assertConfigured(): void {
    this.secret();
  }

  signAccess(userId: string, sessionId: string): string {
    return this.jwt.sign(
      { sub: userId, sid: sessionId, type: 'access' },
      { secret: this.secret(), algorithm: 'HS256', expiresIn: ACCESS_TTL_SECONDS },
    );
  }

  verifyAccess(token: string): { userId: string; sessionId: string } {
    const secret = this.secret();
    let payload: { sub?: unknown; sid?: unknown; type?: unknown };
    try {
      payload = this.jwt.verify(token, { secret, algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      !UUID_SCHEMA.safeParse(payload.sub).success ||
      !UUID_SCHEMA.safeParse(payload.sid).success ||
      payload.type !== 'access'
    ) {
      throw new UnauthorizedException('Invalid session');
    }
    return { userId: payload.sub, sessionId: payload.sid };
  }

  private secret(): string {
    const secret = this.config.get<string>('AUTH_JWT_SECRET');
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    return secret;
  }
}
