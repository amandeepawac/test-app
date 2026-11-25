import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = this.config.get<string>('AUTH_PROXY_SECRET');
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    const ip = this.clientIp(request, secret);
    const path = request.path.replace(/\/+$/, '').toLowerCase();
    const highTraffic = path.endsWith('/me') || path.endsWith('/refresh');
    await this.increment(secret, `ip:${ip}:${path}`, highTraffic ? 120 : 30, 60_000);

    const body: unknown = request.body;
    if (
      (path.endsWith('/login') || path.endsWith('/register') || path.endsWith('/forgot-password')) &&
      typeof body === 'object' &&
      body !== null &&
      'email' in body &&
      typeof body.email === 'string' &&
      body.email.length <= 254
    ) {
      const email = body.email.trim().normalize('NFC').toLowerCase();
      await this.increment(secret, `account:${email}:${path}`, 5, 15 * 60_000);
    }
    return true;
  }

  private clientIp(request: Request, secret: string): string {
    const ip = request.get('x-auth-client-ip');
    const timestamp = request.get('x-auth-client-time');
    const signature = request.get('x-auth-client-signature');
    if (
      ip &&
      isIP(ip) &&
      timestamp &&
      /^\d{13}$/.test(timestamp) &&
      Math.abs(Date.now() - Number(timestamp)) <= 30_000 &&
      signature &&
      /^[0-9a-f]{64}$/.test(signature)
    ) {
      const expected = createHmac('sha256', secret).update(`${timestamp}:${ip}`).digest();
      if (timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return this.subnet(ip);
    }
    if (ip || timestamp || signature) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    if (!request.ip || !isIP(request.ip)) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    return this.subnet(request.ip);
  }

  private subnet(ip: string): string {
    if (ip.toLowerCase().startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
    if (isIP(ip) === 4) return ip;
    const address = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
    const [left = '', right = ''] = address.split('::');
    const prefix = left ? left.split(':') : [];
    const suffix = right ? right.split(':') : [];
    const groups = address.includes('::')
      ? [...prefix, ...Array<string>(8 - prefix.length - suffix.length).fill('0'), ...suffix]
      : prefix;
    return `${groups.slice(0, 4).map((part) => part.padStart(4, '0')).join(':')}::/64`;
  }

  private async increment(secret: string, value: string, limit: number, ttl: number) {
    const key = createHmac('sha256', secret).update(value).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);
    const rows = await this.prisma.client.$queryRaw<{ attempts: number }[]>`
      INSERT INTO "auth_rate_limits" ("key", "attempts", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "auth_rate_limits"."expiresAt" <= ${now}
          THEN 1 ELSE "auth_rate_limits"."attempts" + 1 END,
        "expiresAt" = CASE WHEN "auth_rate_limits"."expiresAt" <= ${now}
          THEN ${expiresAt} ELSE "auth_rate_limits"."expiresAt" END
      RETURNING "attempts"
    `;
    if (!rows[0]) throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    if (randomInt(100) === 0) {
      await this.prisma.client.$executeRaw`
        DELETE FROM "auth_rate_limits"
        WHERE "key" IN (
          SELECT "key" FROM "auth_rate_limits" WHERE "expiresAt" <= ${now} LIMIT 1000
        )
      `;
    }
    if (rows[0].attempts > limit) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
