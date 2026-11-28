import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Put,
  Delete,
  Param,
  ParseUUIDPipe,
  Req,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  employerProfileUpdateSchema,
  employerVerificationDocumentUploadSchema,
  type EmployerProfileUpdate,
  type EmployerVerificationDocumentUpload,
} from '@repo/contracts';
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

  @Get('verification/documents')
  @Header('Cache-Control', 'no-store')
  async documents(@Req() request: EmployerRequest) {
    const documents = await this.profiles.listDocuments(request.user.id);
    return { documents };
  }

  @Post('verification/documents')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  uploadDocument(
    @Body({ schema: employerVerificationDocumentUploadSchema })
    input: EmployerVerificationDocumentUpload,
    @Req() request: EmployerRequest,
  ) {
    return this.profiles.uploadDocument(request.user.id, input);
  }

  @Delete('verification/documents/:documentId')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  deleteDocument(
    @Param('documentId', new ParseUUIDPipe({ version: 'all' })) documentId: string,
    @Req() request: EmployerRequest,
  ) {
    return this.profiles.deleteDocument(request.user.id, documentId);
  }

  @Post('verification/submit')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  submitVerification(@Req() request: EmployerRequest) {
    return this.profiles.submitVerification(request.user.id);
  }
}
