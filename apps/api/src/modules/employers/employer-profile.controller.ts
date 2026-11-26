import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Put,
  Req,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { employerProfileUpdateSchema, type EmployerProfileUpdate } from '@repo/contracts';
import type { EmployerRequest } from '@/modules/employers/employer-context.js';
import { EmployerAuthGuard } from '@/modules/employers/guards/employer-auth.guard.js';
import { EmployerProfileService } from '@/modules/employers/services/employer-profile.service.js';

@Controller('employers/me')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(EmployerAuthGuard)
export class EmployerProfileController {
  constructor(private readonly profiles: EmployerProfileService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  get(@Req() request: EmployerRequest) {
    return this.profiles.findByUserId(request.user.id);
  }

  @Put()
  @Header('Cache-Control', 'no-store')
  save(
    @Body({ schema: employerProfileUpdateSchema }) input: EmployerProfileUpdate,
    @Req() request: EmployerRequest,
  ) {
    return this.profiles.save(request.user.id, input);
  }

  @Post('complete')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  complete(@Req() request: EmployerRequest) {
    return this.profiles.complete(request.user.id);
  }

  @Get('verification')
  @Header('Cache-Control', 'no-store')
  verification(@Req() request: EmployerRequest) {
    return this.profiles.verification(request.user.id);
  }
}
