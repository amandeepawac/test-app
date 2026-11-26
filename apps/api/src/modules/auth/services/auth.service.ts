import { Injectable } from '@nestjs/common';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegistrationRequest,
  ResetPasswordRequest,
} from '@repo/contracts';
import { EmailVerificationProvider } from '@/modules/auth/providers/email-verification.provider.js';
import { LoginProvider } from '@/modules/auth/providers/login.provider.js';
import { PasswordRecoveryProvider } from '@/modules/auth/providers/password-recovery.provider.js';
import { RegistrationProvider } from '@/modules/auth/providers/registration.provider.js';
import { SessionProvider } from '@/modules/auth/providers/session.provider.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly registration: RegistrationProvider,
    private readonly emailVerification: EmailVerificationProvider,
    private readonly loginProvider: LoginProvider,
    private readonly sessions: SessionProvider,
    private readonly passwordRecovery: PasswordRecoveryProvider,
  ) {}

  register(input: RegistrationRequest): Promise<void> {
    return this.registration.register(input);
  }

  verifyEmail(token: string): Promise<void> {
    return this.emailVerification.verify(token);
  }

  login(input: LoginRequest) {
    return this.loginProvider.login(input);
  }

  refresh(refreshToken: string) {
    return this.sessions.refresh(refreshToken);
  }

  logout(refreshToken: string): Promise<void> {
    return this.sessions.logout(refreshToken);
  }

  currentUser(accessToken: string) {
    return this.sessions.currentUser(accessToken);
  }

  requestPasswordReset(input: ForgotPasswordRequest): Promise<void> {
    return this.passwordRecovery.requestReset(input);
  }

  resetPassword(input: ResetPasswordRequest): Promise<void> {
    return this.passwordRecovery.resetPassword(input);
  }
}
