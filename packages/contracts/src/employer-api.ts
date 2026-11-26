import { z } from "zod";
import {
  employerTypeSchema,
  employerVerificationStatusSchema,
} from "./admin-operations-api.js";
import { phoneNumberSchema } from "./contact.js";

const websiteSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "Website must use HTTP or HTTPS");

export const employerProfileUpdateSchema = z.strictObject({
  businessName: z.string().trim().min(1).max(200).optional(),
  employerType: employerTypeSchema.optional(),
  contactPersonName: z.string().trim().min(1).max(200).optional(),
  businessPhone: phoneNumberSchema.optional(),
  stateName: z.string().trim().min(1).max(100).optional(),
  cityName: z.string().trim().min(1).max(100).optional(),
  businessDescription: z.string().trim().max(2000).nullable().optional(),
  addressLine: z.string().trim().max(500).nullable().optional(),
  websiteUrl: websiteSchema.nullable().optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
});

export const employerVerificationResponseSchema = z.strictObject({
  verificationStatus: employerVerificationStatusSchema,
  verificationLevel: z.enum(["NONE", "BASIC", "BUSINESS", "TRUSTED"]),
  verificationSubmittedAt: z.iso.datetime().nullable(),
  verifiedAt: z.iso.datetime().nullable(),
  rejectionReason: z.string().nullable(),
  verificationNote: z.string().nullable(),
});

export const employerProfileResponseSchema = z.strictObject({
  id: z.uuid(),
  businessName: z.string().nullable(),
  employerType: employerTypeSchema.nullable(),
  contactPersonName: z.string().nullable(),
  businessPhone: z.string().nullable(),
  email: z.string().email(),
  stateName: z.string().nullable(),
  cityName: z.string().nullable(),
  businessDescription: z.string().nullable(),
  addressLine: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
  verification: employerVerificationResponseSchema,
});

export type EmployerProfileUpdate = z.infer<typeof employerProfileUpdateSchema>;
export type EmployerProfileResponse = z.infer<typeof employerProfileResponseSchema>;
export type EmployerVerificationResponse = z.infer<typeof employerVerificationResponseSchema>;
