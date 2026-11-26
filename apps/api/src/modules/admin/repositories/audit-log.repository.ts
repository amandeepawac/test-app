import type {
  AdminAuditLogListResponse,
  AdminAuditLogQuery,
} from '@repo/contracts';

export abstract class AuditLogRepository {
  abstract list(query: AdminAuditLogQuery): Promise<AdminAuditLogListResponse>;
}
