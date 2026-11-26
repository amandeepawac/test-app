import {
  Controller,
  Get,
  Header,
  Query,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { adminAuditLogQuerySchema, type AdminAuditLogQuery } from '@repo/contracts';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { AuditLogAdminService } from '@/modules/admin/services/audit-log-admin.service.js';

@Controller('admin/audit-logs')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(AdminAuthGuard)
export class AuditLogAdminController {
  constructor(private readonly auditLogs: AuditLogAdminService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Query({ schema: adminAuditLogQuerySchema }) query: AdminAuditLogQuery) {
    return this.auditLogs.list(query);
  }
}
