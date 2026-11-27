import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '@/infrastructure/mail/mail.module.js';
import { AuthService } from '@/modules/auth/services/auth.service.js';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { AuthAccountRepository } from './repositories/auth-account.repository.js';
import { GoogleAuthRepository } from './repositories/google-auth.repository.js';
import { PrismaGoogleAuthRepository } from './repositories/prisma-google-auth.repository.js';
import { PasswordRecoveryRepository } from './repositories/password-recovery.repository.js';
import { PrismaAuthAccountRepository } from './repositories/prisma-auth-account.repository.js';
import { PrismaPasswordRecoveryRepository } from './repositories/prisma-password-recovery.repository.js';
import { PrismaSessionRepository } from './repositories/prisma-session.repository.js';
import { SessionRepository } from './repositories/session.repository.js';
import { EmailVerificationProvider } from './providers/email-verification.provider.js';
import { LoginProvider } from './providers/login.provider.js';
import { GoogleAuthProvider } from './providers/google-auth.provider.js';
import { GoogleIdentityProvider } from './providers/google-identity.provider.js';
import { PasswordRecoveryProvider } from './providers/password-recovery.provider.js';
import { PasswordProvider } from './providers/password.provider.js';
import { RegistrationProvider } from './providers/registration.provider.js';
import { SessionProvider } from './providers/session.provider.js';
import { TokenProvider } from './providers/token.provider.js';
import { VerificationMailProvider } from './providers/verification-mail.provider.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [DatabaseModule, MailModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationProvider,
    LoginProvider,
    GoogleAuthProvider,
    GoogleIdentityProvider,
    RegistrationProvider,
    PasswordProvider,
    SessionProvider,
    TokenProvider,
    PasswordRecoveryProvider,
    VerificationMailProvider,
    { provide: AuthAccountRepository, useClass: PrismaAuthAccountRepository },
    { provide: GoogleAuthRepository, useClass: PrismaGoogleAuthRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: PasswordRecoveryRepository, useClass: PrismaPasswordRecoveryRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}
