import { Injectable } from '@nestjs/common';
import type { AdminAuditLogQuery } from '@repo/contracts';
import { AuditLogRepository } from '@/modules/admin/repositories/audit-log.repository.js';

@Injectable()
export class AuditLogAdminService {
  constructor(private readonly auditLogs: AuditLogRepository) {}

  list(query: AdminAuditLogQuery) {
    return this.auditLogs.list(query);
  }
}
