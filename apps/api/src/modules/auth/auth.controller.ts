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
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  registrationRequestSchema,
  verifyEmailRequestSchema,
  loginRequestSchema,
  googleAuthRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  refreshRequestSchema,
  type RegistrationRequest,
  type VerifyEmailRequest,
  type LoginRequest,
  type GoogleAuthRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type RefreshRequest,
} from '@repo/contracts';
import { AuthService } from '@/modules/auth/services/auth.service.js';

@Controller('auth')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@UsePipes(new StandardSchemaValidationPipe())
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(202)
  async register(@Body({ schema: registrationRequestSchema }) body: RegistrationRequest) {
    await this.auth.register(body);
    return { accepted: true };
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  async verifyEmail(@Body({ schema: verifyEmailRequestSchema }) body: VerifyEmailRequest) {
    await this.auth.verifyEmail(body.token);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  login(@Body({ schema: loginRequestSchema }) body: LoginRequest) {
    return this.auth.login(body);
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  google(
    @Body({ schema: googleAuthRequestSchema }) body: GoogleAuthRequest,
    @Headers('authorization') authorization?: string,
  ) {
    return this.auth.google(body, authorization);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  refresh(@Body({ schema: refreshRequestSchema }) body: RefreshRequest) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body({ schema: refreshRequestSchema }) body: RefreshRequest) {
    await this.auth.logout(body.refreshToken);
  }

  @Get('me')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store')
  me(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Invalid session');
    return this.auth.currentUser(authorization.slice(7));
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(202)
  async forgotPassword(@Body({ schema: forgotPasswordRequestSchema }) body: ForgotPasswordRequest) {
    await this.auth.requestPasswordReset(body);
    return { accepted: true };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  async resetPassword(@Body({ schema: resetPasswordRequestSchema }) body: ResetPasswordRequest) {
    await this.auth.resetPassword(body);
  }
}
