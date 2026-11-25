import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module.js';
import { AuthController } from './auth.controller.js';
import { PasswordService } from './password.service.js';
import { RegistrationService } from './registration.service.js';
import { VerificationMailService } from './verification-mail.service.js';
import { SessionService } from './session.service.js';
import { TokenService } from './token.service.js';
import { PasswordRecoveryService } from './password-recovery.service.js';
import { AuthRateLimitGuard } from './auth-rate-limit.guard.js';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    RegistrationService,
    PasswordService,
    VerificationMailService,
    SessionService,
    TokenService,
    PasswordRecoveryService,
    AuthRateLimitGuard,
  ],
})
export class AuthModule {}
