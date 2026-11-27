import { z } from "zod";
import { phoneNumberSchema } from "./contact.js";

const experienceLevelSchema = z.enum([
  "NO_EXPERIENCE",
  "ENTRY_LEVEL",
  "LESS_THAN_1_YEAR",
  "ONE_TO_THREE_YEARS",
  "THREE_TO_FIVE_YEARS",
  "FIVE_TO_TEN_YEARS",
  "TEN_PLUS_YEARS",
]);

export const jobSeekerSkillsQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).max(100).optional(),
});

export const jobSeekerSkillsResponseSchema = z.strictObject({
  items: z.array(z.strictObject({ id: z.uuid(), name: z.string() })),
  pageInfo: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export const jobSeekerProfileUpdateSchema = z
  .strictObject({
    fullName: z.string().trim().min(1).max(200).optional(),
    phone: phoneNumberSchema.optional(),
    stateName: z.string().trim().min(1).max(100).optional(),
    cityName: z.string().trim().min(1).max(100).optional(),
    experienceLevel: experienceLevelSchema.optional(),
    experienceSummary: z.string().trim().max(2000).nullable().optional(),
    skillIds: z.array(z.uuid()).max(50).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
  })
  .refine(
    (value) =>
      !value.skillIds || new Set(value.skillIds).size === value.skillIds.length,
    { path: ["skillIds"], message: "Skills must not contain duplicates" },
  );

export const jobSeekerProfileResponseSchema = z.strictObject({
  id: z.uuid(),
  fullName: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  stateName: z.string().nullable(),
  cityName: z.string().nullable(),
  experienceLevel: experienceLevelSchema.nullable(),
  experienceSummary: z.string().nullable(),
  skills: z.array(z.strictObject({ id: z.uuid(), name: z.string() })),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
});

export type JobSeekerProfileUpdate = z.infer<
  typeof jobSeekerProfileUpdateSchema
>;
export type JobSeekerProfileResponse = z.infer<
  typeof jobSeekerProfileResponseSchema
>;
export type JobSeekerSkillsQuery = z.infer<typeof jobSeekerSkillsQuerySchema>;
export type JobSeekerSkillsResponse = z.infer<
  typeof jobSeekerSkillsResponseSchema
>;
