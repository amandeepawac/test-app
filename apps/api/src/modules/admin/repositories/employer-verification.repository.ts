import type {
  AdminEmployerVerificationDecision,
  AdminEmployerVerificationDecisionResponse,
  AdminEmployerVerificationDetailResponse,
  AdminEmployerDocumentReview,
  AdminEmployerDocumentReviewResponse,
  AdminEmployerVerificationListResponse,
  AdminEmployerVerificationQuery,
} from '@repo/contracts';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';

export abstract class EmployerVerificationRepository {
  abstract list(
    query: AdminEmployerVerificationQuery,
  ): Promise<AdminEmployerVerificationListResponse>;
  abstract findById(id: string): Promise<AdminEmployerVerificationDetailResponse | null>;
  abstract recordDocumentAccess(
    employerId: string,
    documentId: string,
    context: AdminActionContext,
  ): Promise<{ assetId: string }>;
  abstract review(
    id: string,
    decision: AdminEmployerVerificationDecision,
    context: AdminActionContext,
  ): Promise<AdminEmployerVerificationDecisionResponse>;
  abstract reviewDocument(
    employerId: string,
    documentId: string,
    input: AdminEmployerDocumentReview,
    context: AdminActionContext,
  ): Promise<AdminEmployerDocumentReviewResponse>;
}
