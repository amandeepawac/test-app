import { z } from "zod";

export const publicJobsQuerySchema = z.strictObject({
  keyword: z.string().trim().max(200).optional(),
  categoryId: z.uuid().optional(),
  stateName: z.string().trim().max(100).optional(),
  cityName: z.string().trim().max(100).optional(),
  employmentType: z
    .enum([
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "TEMPORARY",
      "DAILY_WAGE",
      "APPRENTICESHIP",
      "INTERNSHIP",
      "FREELANCE",
    ])
    .optional(),
  salaryMin: z.coerce.number().finite().min(0).max(9999999999.99).optional(),
  salaryMax: z.coerce.number().finite().min(0).max(9999999999.99).optional(),
  sort: z.enum(["NEWEST", "OLDEST", "SALARY_LOW", "SALARY_HIGH"]).default("NEWEST"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).superRefine((value, context) => {
  if (
    value.salaryMin !== undefined &&
    value.salaryMax !== undefined &&
    value.salaryMin > value.salaryMax
  ) {
    context.addIssue({
      code: "custom",
      path: ["salaryMin"],
      message: "Minimum salary cannot exceed maximum salary",
    });
  }
});

const publicEmployerSchema = z.strictObject({
  id: z.uuid(),
  businessName: z.string().nullable(),
  employerType: z
    .enum([
      "COMPANY",
      "SMALL_BUSINESS",
      "SHOP",
      "FACTORY",
      "RESTAURANT",
      "CONTRACTOR",
      "NON_PROFIT",
      "HOUSEHOLD",
      "INDIVIDUAL",
      "OTHER",
    ])
    .nullable(),
  verificationStatus: z.literal("VERIFIED"),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
});

export const publicJobSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  responsibilities: z.string().nullable(),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "TEMPORARY",
    "DAILY_WAGE",
    "APPRENTICESHIP",
    "INTERNSHIP",
    "FREELANCE",
  ]),
  workMode: z.enum(["ON_SITE", "REMOTE", "HYBRID"]),
  experienceLevel: z.enum([
    "NO_EXPERIENCE",
    "ENTRY_LEVEL",
    "LESS_THAN_1_YEAR",
    "ONE_TO_THREE_YEARS",
    "THREE_TO_FIVE_YEARS",
    "FIVE_TO_TEN_YEARS",
    "TEN_PLUS_YEARS",
  ]),
  salaryMin: z.string().nullable(),
  salaryMax: z.string().nullable(),
  salaryPeriod: z.enum([
    "HOUR",
    "DAY",
    "WEEK",
    "MONTH",
    "YEAR",
    "FIXED",
    "NEGOTIABLE",
  ]),
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
  publishedAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  category: z.strictObject({ id: z.uuid(), name: z.string() }).nullable(),
  skills: z.array(z.strictObject({ id: z.uuid(), name: z.string() })),
  employer: publicEmployerSchema,
});

export const publicJobListResponseSchema = z.strictObject({
  items: z.array(publicJobSchema),
  pageInfo: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export const publicJobCategorySchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});
export const publicJobCategoriesResponseSchema = z.strictObject({
  items: z.array(publicJobCategorySchema),
});

export type PublicJobsQuery = z.infer<typeof publicJobsQuerySchema>;
export type PublicJob = z.infer<typeof publicJobSchema>;
export type PublicJobListResponse = z.infer<typeof publicJobListResponseSchema>;
