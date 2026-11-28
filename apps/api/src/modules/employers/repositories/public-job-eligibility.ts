import type { Prisma } from '@repo/db/generated';

export function publicJobEligibility(now: Date): Prisma.JobWhereInput {
  return {
    status: 'PUBLISHED',
    employer: { is: { verificationStatus: 'VERIFIED' } },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}
