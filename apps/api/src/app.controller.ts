import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service.js';
import type { HealthResponse } from '@repo/contracts';

@Controller()
@SkipThrottle()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
