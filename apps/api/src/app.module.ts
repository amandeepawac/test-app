import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import { AppController } from '@/app.controller.js';
import { AppService } from '@/app.service.js';
import { ApiConfigModule } from '@/config/config.module.js';
import { getTrustedClientIp } from '@/common/utils/trusted-client-ip.js';
import { AdminModule } from '@/modules/admin/admin.module.js';
import {
  getAccountThrottleKey,
  shouldSkipAccountThrottle,
} from '@/modules/auth/auth-throttling.js';
import { AuthModule } from '@/modules/auth/auth.module.js';

@Module({
  imports: [
    ApiConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const proxySecret = config.get<string>('AUTH_PROXY_SECRET');
        return {
          throttlers: [
            {
              name: 'default',
              limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
              ttl: config.getOrThrow<number>('THROTTLE_TTL'),
              getTracker: (request) =>
                getTrustedClientIp(request as unknown as Request, proxySecret),
            },
            {
              name: 'auth-account',
              limit: 5,
              ttl: 15 * 60_000,
              skipIf: shouldSkipAccountThrottle,
              getTracker: (request) =>
                getAccountThrottleKey(request as unknown as Request, proxySecret),
            },
          ],
        };
      },
    }),
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
