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
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "Website must use HTTP or HTTPS",
  );

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

export const employerDocumentTypeSchema = z.enum([
  "GST_CERTIFICATE",
  "UDYAM_CERTIFICATE",
  "SHOP_ESTABLISHMENT_REGISTRATION",
  "TRADE_LICENSE",
  "INCORPORATION_CERTIFICATE",
  "BUSINESS_ADDRESS_PROOF",
  "BUSINESS_BANK_PROOF",
  "FSSAI_LICENSE",
  "REPRESENTATIVE_AUTHORIZATION",
  "OTHER",
]);

export const employerVerificationDocumentResponseSchema = z.strictObject({
  id: z.uuid(),
  documentType: employerDocumentTypeSchema,
  originalName: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSizeBytes: z.string().nullable(),
  reviewStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
  reviewNote: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const employerVerificationDocumentUploadSchema = z.strictObject({
  documentType: employerDocumentTypeSchema,
  originalName: z
    .string()
    .trim()
    .min(1)
    .max(255),
  mimeType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  base64Data: z
    .string()
    .trim()
    .min(1)
    .max(7_000_000),
});

export const employerVerificationDocumentListResponseSchema = z.strictObject({
  documents: z.array(employerVerificationDocumentResponseSchema),
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
export type EmployerProfileResponse = z.infer<
  typeof employerProfileResponseSchema
>;
export type EmployerVerificationResponse = z.infer<
  typeof employerVerificationResponseSchema
>;
export type EmployerDocumentType = z.infer<typeof employerDocumentTypeSchema>;
export type EmployerVerificationDocumentUpload = z.infer<
  typeof employerVerificationDocumentUploadSchema
>;
export type EmployerVerificationDocumentResponse = z.infer<
  typeof employerVerificationDocumentResponseSchema
>;
