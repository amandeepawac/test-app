import {
  Body,
  Controller,
  HttpCode,
  Post,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  registrationRequestSchema,
  verifyEmailRequestSchema,
  type RegistrationRequest,
  type VerifyEmailRequest,
} from '@repo/contracts';
import { RegistrationService } from './registration.service.js';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@UsePipes(new StandardSchemaValidationPipe())
export class AuthController {
  constructor(private readonly registration: RegistrationService) {}

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
}
