import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  adminEmployerDocumentReviewSchema,
  adminEmployerVerificationDecisionSchema,
  adminEmployerVerificationQuerySchema,
  type AdminEmployerDocumentReview,
  type AdminEmployerVerificationDecision,
  type AdminEmployerVerificationQuery,
} from '@repo/contracts';
import { getAdminActionContext, type AdminRequest } from '@/modules/admin/admin-context.js';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { EmployerVerificationAdminService } from '@/modules/admin/services/employer-verification-admin.service.js';

@Controller('admin/employer-verifications')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(AdminAuthGuard)
export class EmployerVerificationAdminController {
  constructor(private readonly verifications: EmployerVerificationAdminService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(
    @Query({ schema: adminEmployerVerificationQuerySchema }) query: AdminEmployerVerificationQuery,
  ) {
    return this.verifications.list(query);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  findById(@Param('id', new ParseUUIDPipe({ version: 'all' })) id: string) {
    return this.verifications.findById(id);
  }

  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  review(
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Body({ schema: adminEmployerVerificationDecisionSchema })
    body: AdminEmployerVerificationDecision,
    @Req() request: AdminRequest,
  ) {
    return this.verifications.review(id, body, getAdminActionContext(request));
  }

  @Patch(':id/documents/:documentId')
  @Header('Cache-Control', 'no-store')
  reviewDocument(
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Param('documentId', new ParseUUIDPipe({ version: 'all' })) documentId: string,
    @Body({ schema: adminEmployerDocumentReviewSchema }) body: AdminEmployerDocumentReview,
    @Req() request: AdminRequest,
  ) {
    return this.verifications.reviewDocument(id, documentId, body, getAdminActionContext(request));
  }
}
