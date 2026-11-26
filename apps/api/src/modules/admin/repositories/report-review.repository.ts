import type {
  AdminReportDetailResponse,
  AdminReportListResponse,
  AdminReportQuery,
  AdminReportUpdate,
  AdminReportUpdateResponse,
} from '@repo/contracts';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';

export abstract class ReportReviewRepository {
  abstract list(query: AdminReportQuery): Promise<AdminReportListResponse>;
  abstract findById(id: string): Promise<AdminReportDetailResponse | null>;
  abstract update(
    id: string,
    input: AdminReportUpdate,
    context: AdminActionContext,
  ): Promise<AdminReportUpdateResponse>;
}
