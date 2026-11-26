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
  adminReportQuerySchema,
  adminReportUpdateSchema,
  type AdminReportQuery,
  type AdminReportUpdate,
} from '@repo/contracts';
import { getAdminActionContext, type AdminRequest } from '@/modules/admin/admin-context.js';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { ReportReviewAdminService } from '@/modules/admin/services/report-review-admin.service.js';

@Controller('admin/reports')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(AdminAuthGuard)
export class ReportReviewAdminController {
  constructor(private readonly reports: ReportReviewAdminService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Query({ schema: adminReportQuerySchema }) query: AdminReportQuery) {
    return this.reports.list(query);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  findById(@Param('id', new ParseUUIDPipe({ version: 'all' })) id: string) {
    return this.reports.findById(id);
  }

  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  update(
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Body({ schema: adminReportUpdateSchema }) body: AdminReportUpdate,
    @Req() request: AdminRequest,
  ) {
    return this.reports.update(id, body, getAdminActionContext(request));
  }
}
