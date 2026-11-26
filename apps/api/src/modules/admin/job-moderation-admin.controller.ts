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
  adminJobModerationDecisionSchema,
  adminJobModerationQuerySchema,
  type AdminJobModerationDecision,
  type AdminJobModerationQuery,
} from '@repo/contracts';
import { getAdminActionContext, type AdminRequest } from '@/modules/admin/admin-context.js';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { JobModerationAdminService } from '@/modules/admin/services/job-moderation-admin.service.js';

@Controller('admin/jobs')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(AdminAuthGuard)
export class JobModerationAdminController {
  constructor(private readonly jobs: JobModerationAdminService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Query({ schema: adminJobModerationQuerySchema }) query: AdminJobModerationQuery) {
    return this.jobs.list(query);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  findById(@Param('id', new ParseUUIDPipe({ version: 'all' })) id: string) {
    return this.jobs.findById(id);
  }

  @Patch(':id/moderation')
  @Header('Cache-Control', 'no-store')
  moderate(
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Body({ schema: adminJobModerationDecisionSchema }) body: AdminJobModerationDecision,
    @Req() request: AdminRequest,
  ) {
    return this.jobs.moderate(id, body, getAdminActionContext(request));
  }
}
