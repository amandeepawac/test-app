import {
  adminAuditLogQuerySchema,
  adminEmployerDocumentReviewSchema,
  adminEmployerVerificationDecisionSchema,
  adminJobModerationDecisionSchema,
  adminReportUpdateSchema,
} from '@repo/contracts';

describe('admin operation request schemas', () => {
  it('requires a note when rejecting an employer verification', () => {
    expect(adminEmployerVerificationDecisionSchema.safeParse({ decision: 'REJECT' }).success).toBe(
      false,
    );
  });

  it('requires a reason for job moderation decisions', () => {
    expect(adminJobModerationDecisionSchema.safeParse({ decision: 'REMOVE' }).success).toBe(false);
  });

  it('requires a resolution note for completed report reviews', () => {
    expect(adminReportUpdateSchema.safeParse({ status: 'ACTION_TAKEN' }).success).toBe(false);
  });

  it('requires a note for document rejection', () => {
    expect(
      adminEmployerDocumentReviewSchema.safeParse({ decision: 'REJECT' }).success,
    ).toBe(false);
  });

  it('rejects audit date ranges whose end precedes their start', () => {
    expect(
      adminAuditLogQuerySchema.safeParse({
        from: '2026-01-02T00:00:00.000Z',
        to: '2026-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});
