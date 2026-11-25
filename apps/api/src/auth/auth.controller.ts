import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  registrationRequestSchema,
  verifyEmailRequestSchema,
  loginRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  refreshRequestSchema,
  type RegistrationRequest,
  type VerifyEmailRequest,
  type LoginRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type RefreshRequest,
} from '@repo/contracts';
import { RegistrationService } from './registration.service.js';
import { SessionService } from './session.service.js';
import { PasswordRecoveryService } from './password-recovery.service.js';
import { AuthRateLimitGuard } from './auth-rate-limit.guard.js';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
@UsePipes(new StandardSchemaValidationPipe())
export class AuthController {
  constructor(
    private readonly registration: RegistrationService,
    private readonly sessions: SessionService,
    private readonly recovery: PasswordRecoveryService,
  ) {}

  @Post('register')
  @HttpCode(202)
  async register(@Body({ schema: registrationRequestSchema }) body: RegistrationRequest) {
    await this.registration.register(body);
    return { accepted: true };
  }

  @Post('verify-email')
  @HttpCode(204)
  async verifyEmail(@Body({ schema: verifyEmailRequestSchema }) body: VerifyEmailRequest) {
    await this.registration.verifyEmail(body.token);
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  login(@Body({ schema: loginRequestSchema }) body: LoginRequest) {
    return this.sessions.login(body);
  }

  @Post('refresh')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  refresh(@Body({ schema: refreshRequestSchema }) body: RefreshRequest) {
    return this.sessions.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body({ schema: refreshRequestSchema }) body: RefreshRequest) {
    await this.sessions.logout(body.refreshToken);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Invalid session');
    return this.sessions.currentUser(authorization.slice(7));
  }

  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body({ schema: forgotPasswordRequestSchema }) body: ForgotPasswordRequest) {
    await this.recovery.requestReset(body);
    return { accepted: true };
  }

  @Post('reset-password')
  @HttpCode(204)
  async resetPassword(@Body({ schema: resetPasswordRequestSchema }) body: ResetPasswordRequest) {
    await this.recovery.resetPassword(body);
  }
}
