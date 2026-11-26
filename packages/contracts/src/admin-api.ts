import { z } from "zod";

const nonNegativeCount = z.number().int().nonnegative();

export const adminDashboardResponseSchema = z.strictObject({
  users: z.strictObject({
    total: nonNegativeCount,
    jobSeekers: nonNegativeCount,
    employers: nonNegativeCount,
    admins: nonNegativeCount,
    suspended: nonNegativeCount,
  }),
  jobs: z.strictObject({
    total: nonNegativeCount,
    published: nonNegativeCount,
    pendingReview: nonNegativeCount,
  }),
  employerVerifications: z.strictObject({
    pending: nonNegativeCount,
    underReview: nonNegativeCount,
    needsMoreInfo: nonNegativeCount,
  }),
  reports: z.strictObject({
    open: nonNegativeCount,
    underReview: nonNegativeCount,
  }),
  recentActivity: z.array(
    z.strictObject({
      id: z.uuid(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().nullable(),
      createdAt: z.iso.datetime(),
      actor: z
        .strictObject({
          id: z.uuid(),
          name: z.string().nullable(),
          email: z.string().email(),
        })
        .nullable(),
    }),
  ),
});

export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>;
