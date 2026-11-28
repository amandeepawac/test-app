import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "APPLIED",
  "REVIEWING",
  "SHORTLISTED",
  "CONTACTED",
  "REJECTED",
  "HIRED",
  "WITHDRAWN",
]);

export const createApplicationSchema = z.strictObject({
  coverMessage: z.string().trim().max(2000).optional(),
});

export const updateApplicationStatusSchema = z.strictObject({
  status: z.enum(["REVIEWING", "SHORTLISTED", "CONTACTED", "REJECTED", "HIRED"]),
  note: z.string().trim().max(1000).optional(),
});

const historyItemSchema = z.strictObject({
  oldStatus: applicationStatusSchema.nullable(),
  newStatus: applicationStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

const publicAppliedJobSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  cityName: z.string().nullable(),
  stateName: z.string().nullable(),
  employerName: z.string().nullable(),
});

export const seekerApplicationSchema = z.strictObject({
  id: z.uuid(),
  status: applicationStatusSchema,
  coverMessage: z.string().nullable(),
  appliedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  withdrawnAt: z.iso.datetime().nullable(),
  job: publicAppliedJobSchema,
  history: z.array(historyItemSchema),
});

export const seekerApplicationListResponseSchema = z.strictObject({
  items: z.array(seekerApplicationSchema),
  pageInfo: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export const employerApplicationSchema = z.strictObject({
  id: z.uuid(),
  status: applicationStatusSchema,
  coverMessage: z.string().nullable(),
  appliedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  seeker: z.strictObject({
    id: z.uuid(),
    fullName: z.string().nullable(),
    experienceLevel: z.string().nullable(),
    experienceSummary: z.string().nullable(),
    cityName: z.string().nullable(),
    stateName: z.string().nullable(),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    skills: z.array(z.string()),
  }),
  history: z.array(historyItemSchema),
});

export const employerApplicationListResponseSchema = z.strictObject({
  items: z.array(employerApplicationSchema),
  pageInfo: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export const applicationPageQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const applicationResponseSchema = z.strictObject({
  id: z.uuid(),
  status: applicationStatusSchema,
  appliedAt: z.iso.datetime(),
});

export type CreateApplication = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatus = z.infer<typeof updateApplicationStatusSchema>;
export type SeekerApplicationListResponse = z.infer<
  typeof seekerApplicationListResponseSchema
>;
export type EmployerApplicationListResponse = z.infer<
  typeof employerApplicationListResponseSchema
>;
