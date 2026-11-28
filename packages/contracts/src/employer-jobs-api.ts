import { z } from "zod";

const employmentType = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
  "DAILY_WAGE",
  "APPRENTICESHIP",
  "INTERNSHIP",
  "FREELANCE",
]);
const workMode = z.enum(["ON_SITE", "REMOTE", "HYBRID"]);
const experienceLevel = z.enum([
  "NO_EXPERIENCE",
  "ENTRY_LEVEL",
  "LESS_THAN_1_YEAR",
  "ONE_TO_THREE_YEARS",
  "THREE_TO_FIVE_YEARS",
  "FIVE_TO_TEN_YEARS",
  "TEN_PLUS_YEARS",
]);
const salaryPeriod = z.enum([
  "HOUR",
  "DAY",
  "WEEK",
  "MONTH",
  "YEAR",
  "FIXED",
  "NEGOTIABLE",
]);
const text = (max: number) => z.string().trim().min(1).max(max);
const salary = z.number().finite().min(0).max(9999999999.99).multipleOf(0.01);

const fields = {
  title: text(200),
  description: text(10000),
  employmentType,
  categoryId: z.uuid().nullable().optional(),
  skillIds: z
    .array(z.uuid())
    .max(50)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Skills must not contain duplicates",
    )
    .optional(),
  responsibilities: text(10000).nullable().optional(),
  workMode: workMode.optional(),
  experienceLevel: experienceLevel.optional(),
  salaryMin: salary.nullable().optional(),
  salaryMax: salary.nullable().optional(),
  salaryPeriod: salaryPeriod.optional(),
  isSalaryNegotiable: z.boolean().optional(),
  openings: z.number().int().min(1).max(100000).optional(),
  addressLine: text(500).nullable().optional(),
  localityName: text(100).nullable().optional(),
  cityName: text(100).nullable().optional(),
  districtName: text(100).nullable().optional(),
  stateName: text(100).nullable().optional(),
  postalCode: text(12).nullable().optional(),
  workingHours: text(500).nullable().optional(),
  shiftDetails: text(500).nullable().optional(),
  isUrgent: z.boolean().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
};

export const employerJobCreateSchema = z.strictObject(fields);
export const employerJobUpdateSchema = z
  .strictObject(fields)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
export const employerJobsQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const employerJobResponseSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  employmentType,
  categoryId: z.uuid().nullable(),
  skillIds: z.array(z.uuid()),
  responsibilities: z.string().nullable(),
  workMode,
  experienceLevel,
  salaryMin: z.string().nullable(),
  salaryMax: z.string().nullable(),
  salaryPeriod,
  isSalaryNegotiable: z.boolean(),
  openings: z.number().int(),
  addressLine: z.string().nullable(),
  localityName: z.string().nullable(),
  cityName: z.string().nullable(),
  districtName: z.string().nullable(),
  stateName: z.string().nullable(),
  postalCode: z.string().nullable(),
  workingHours: z.string().nullable(),
  shiftDetails: z.string().nullable(),
  isUrgent: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  status: z.enum([
    "DRAFT",
    "PENDING_REVIEW",
    "PUBLISHED",
    "PAUSED",
    "HIDDEN",
    "REJECTED",
    "CLOSED",
    "FILLED",
    "EXPIRED",
    "REMOVED",
  ]),
  moderationNote: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const employerJobListResponseSchema = z.strictObject({
  items: z.array(employerJobResponseSchema),
  pageInfo: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export type EmployerJobCreate = z.infer<typeof employerJobCreateSchema>;
export type EmployerJobUpdate = z.infer<typeof employerJobUpdateSchema>;
export type EmployerJobsQuery = z.infer<typeof employerJobsQuerySchema>;
export type EmployerJobResponse = z.infer<typeof employerJobResponseSchema>;
export type EmployerJobListResponse = z.infer<
  typeof employerJobListResponseSchema
>;
