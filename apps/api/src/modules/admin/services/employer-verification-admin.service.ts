import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminEmployerDocumentReview,
  AdminEmployerVerificationDecision,
  AdminEmployerVerificationQuery,
} from '@repo/contracts';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';
import { mapAdminRepositoryErrors } from '@/modules/admin/admin-errors.js';
import { EmployerVerificationRepository } from '@/modules/admin/repositories/employer-verification.repository.js';

@Injectable()
export class EmployerVerificationAdminService {
  constructor(private readonly verifications: EmployerVerificationRepository) {}

  list(query: AdminEmployerVerificationQuery) {
    return this.verifications.list(query);
  }

  async findById(id: string) {
    const verification = await this.verifications.findById(id);
    if (!verification) throw new NotFoundException('Employer verification not found');
    return verification;
  }

  review(id: string, input: AdminEmployerVerificationDecision, context: AdminActionContext) {
    return mapAdminRepositoryErrors(() => this.verifications.review(id, input, context));
  }

  reviewDocument(
    employerId: string,
    documentId: string,
    input: AdminEmployerDocumentReview,
    context: AdminActionContext,
  ) {
    return mapAdminRepositoryErrors(() =>
      this.verifications.reviewDocument(employerId, documentId, input, context),
    );
  }
}
