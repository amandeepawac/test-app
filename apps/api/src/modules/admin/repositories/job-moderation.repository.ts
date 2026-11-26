import type {
  AdminJobDetailResponse,
  AdminJobListResponse,
  AdminJobModerationDecision,
  AdminJobModerationDecisionResponse,
  AdminJobModerationQuery,
} from '@repo/contracts';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';

export abstract class JobModerationRepository {
  abstract list(query: AdminJobModerationQuery): Promise<AdminJobListResponse>;
  abstract findById(id: string): Promise<AdminJobDetailResponse | null>;
  abstract moderate(
    id: string,
    input: AdminJobModerationDecision,
    context: AdminActionContext,
  ): Promise<AdminJobModerationDecisionResponse>;
}
