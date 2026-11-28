import { z } from "zod";

export const savedJobsQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const savedJobStateSchema = z.strictObject({
  jobId: z.uuid(),
  saved: z.boolean(),
});

export const savedJobListResponseSchema = z.strictObject({
  items: z.array(z.strictObject({
    jobId: z.uuid(),
    savedAt: z.iso.datetime(),
    job: z.strictObject({
      title: z.string(),
      cityName: z.string().nullable(),
      stateName: z.string().nullable(),
      employerName: z.string().nullable(),
    }).nullable(),
  })),
  pageInfo: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export type SavedJobsQuery = z.infer<typeof savedJobsQuerySchema>;
export type SavedJobState = z.infer<typeof savedJobStateSchema>;
export type SavedJobListResponse = z.infer<typeof savedJobListResponseSchema>;
