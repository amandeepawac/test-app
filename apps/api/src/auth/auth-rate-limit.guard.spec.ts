import { Controller, INestApplication, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../database/prisma.service.js';
import { AuthRateLimitGuard } from './auth-rate-limit.guard.js';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
class RateLimitTestController {
  @Post('login')
  login() {
    return { ok: true };
  }
}

describe('AuthRateLimitGuard', () => {
  const secret = 'a'.repeat(32);
  const counts = new Map<string, number>();
  const client = {
    $queryRaw: vi.fn(async (_query: TemplateStringsArray, key: string) => {
      const attempts = (counts.get(key) ?? 0) + 1;
      counts.set(key, attempts);
      return [{ attempts }];
    }),
    $executeRaw: vi.fn(),
  };
  let app: INestApplication;

  beforeEach(async () => {
    counts.clear();
    const module = await Test.createTestingModule({
      controllers: [RateLimitTestController],
      providers: [
        AuthRateLimitGuard,
        { provide: PrismaService, useValue: { client } },
        { provide: ConfigService, useValue: { get: () => secret } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('enforces the account limit across different signed client IPs', async () => {
    for (let i = 1; i <= 6; i++) {
      const ip = `192.0.2.${i}`;
      const timestamp = Date.now().toString();
      const signature = createHmac('sha256', secret).update(`${timestamp}:${ip}`).digest('hex');
      await request(app.getHttpServer())
        .post(i % 2 === 0 ? '/auth/LOGIN/' : '/auth/login')
        .set('x-auth-client-ip', ip)
        .set('x-auth-client-time', timestamp)
        .set('x-auth-client-signature', signature)
        .send({ email: 'User@example.com' })
        .expect(i <= 5 ? 201 : 429);
    }
  });

  it('fails closed when a forwarded client identity has an invalid signature', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-auth-client-ip', '192.0.2.1')
      .set('x-auth-client-time', Date.now().toString())
      .set('x-auth-client-signature', '0'.repeat(64))
      .send({ email: 'user@example.com' })
      .expect(503);
    expect(counts.size).toBe(0);
  });
});
