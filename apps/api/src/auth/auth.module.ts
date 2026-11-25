import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module.js';
import { AuthController } from './auth.controller.js';
import { PasswordService } from './password.service.js';
import { RegistrationService } from './registration.service.js';
import { VerificationMailService } from './verification-mail.service.js';

@Module({
  imports: [DatabaseModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
  controllers: [AuthController],
  providers: [RegistrationService, PasswordService, VerificationMailService],
})
export class AuthModule {}
