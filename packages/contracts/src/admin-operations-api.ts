import { z } from "zod";

const pageQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const pageInfoSchema = z.strictObject({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
});

const paginatedResponseSchema = <T extends z.ZodType>(item: T) =>
  z.strictObject({ items: z.array(item), pageInfo: pageInfoSchema });

export const employerVerificationStatusSchema = z.enum([
  "NOT_SUBMITTED",
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "NEEDS_MORE_INFO",
  "SUSPENDED",
]);
export const employerTypeSchema = z.enum([
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
]);
const employerDocumentTypeSchema = z.enum([
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

const adminEmployerSummarySchema = z.strictObject({
  id: z.uuid(),
  businessName: z.string().nullable(),
  employerType: employerTypeSchema.nullable(),
  verificationStatus: employerVerificationStatusSchema,
  verificationSubmittedAt: z.iso.datetime().nullable(),
  pendingDocuments: z.number().int().nonnegative(),
  user: z.strictObject({
    id: z.uuid(),
    name: z.string().nullable(),
    email: z.string().email(),
  }),
});

export const adminEmployerVerificationQuerySchema = pageQuerySchema.extend({
  status: employerVerificationStatusSchema.optional(),
});
export const adminEmployerVerificationListResponseSchema =
  paginatedResponseSchema(adminEmployerSummarySchema);
export const adminEmployerVerificationDetailResponseSchema =
  adminEmployerSummarySchema.extend({
    verificationLevel: z.enum(["NONE", "BASIC", "BUSINESS", "TRUSTED"]),
    contactPersonName: z.string().nullable(),
    businessDescription: z.string().nullable(),
    businessPhone: z.string().nullable(),
    websiteUrl: z.string().nullable(),
    addressLine: z.string().nullable(),
    cityName: z.string().nullable(),
    districtName: z.string().nullable(),
    stateName: z.string().nullable(),
    postalCode: z.string().nullable(),
    verificationNote: z.string().nullable(),
    rejectionReason: z.string().nullable(),
    documents: z.array(
      z.strictObject({
        id: z.uuid(),
        documentType: employerDocumentTypeSchema,
        storageKey: z.string(),
        originalName: z.string().nullable(),
        mimeType: z.string().nullable(),
        fileSizeBytes: z.string().nullable(),
        documentNumber: z.string().nullable(),
        issuedAt: z.iso.datetime().nullable(),
        expiresAt: z.iso.datetime().nullable(),
        reviewStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
        reviewNote: z.string().nullable(),
      }),
    ),
  });
export const adminEmployerVerificationDecisionSchema = z
  .strictObject({
    decision: z.enum(["UNDER_REVIEW", "APPROVE", "REJECT", "NEEDS_MORE_INFO"]),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .superRefine((value, context) => {
    if (["REJECT", "NEEDS_MORE_INFO"].includes(value.decision) && !value.note) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "A note is required for this decision",
      });
    }
  });
export const adminEmployerVerificationDecisionResponseSchema = z.strictObject({
  id: z.uuid(),
  verificationStatus: employerVerificationStatusSchema,
  verificationNote: z.string().nullable(),
  rejectionReason: z.string().nullable(),
});
export type AdminEmployerVerificationQuery = z.infer<
  typeof adminEmployerVerificationQuerySchema
>;
export type AdminEmployerVerificationDecision = z.infer<
  typeof adminEmployerVerificationDecisionSchema
>;
export type AdminEmployerVerificationListResponse = z.infer<
  typeof adminEmployerVerificationListResponseSchema
>;
export type AdminEmployerVerificationDetailResponse = z.infer<
  typeof adminEmployerVerificationDetailResponseSchema
>;
export type AdminEmployerVerificationDecisionResponse = z.infer<
  typeof adminEmployerVerificationDecisionResponseSchema
>;
export const adminEmployerDocumentReviewSchema = z
  .strictObject({
    decision: z.enum(["APPROVE", "REJECT"]),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "REJECT" && !value.note) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "A note is required when rejecting a document",
      });
    }
  });
export const adminEmployerDocumentReviewResponseSchema = z.strictObject({
  id: z.uuid(),
  reviewStatus: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().nullable(),
  reviewedAt: z.iso.datetime(),
});
export type AdminEmployerDocumentReview = z.infer<
  typeof adminEmployerDocumentReviewSchema
>;
export type AdminEmployerDocumentReviewResponse = z.infer<
  typeof adminEmployerDocumentReviewResponseSchema
>;

const jobStatusSchema = z.enum([
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
]);
const adminJobSummarySchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  status: jobStatusSchema,
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
  cityName: z.string().nullable(),
  stateName: z.string().nullable(),
  createdAt: z.iso.datetime(),
  employer: z.strictObject({
    id: z.uuid(),
    businessName: z.string().nullable(),
    user: z.strictObject({
      id: z.uuid(),
      name: z.string().nullable(),
      email: z.string().email(),
    }),
  }),
});
export const adminJobModerationQuerySchema = pageQuerySchema.extend({
  status: jobStatusSchema.optional(),
});
export const adminJobListResponseSchema = paginatedResponseSchema(
  adminJobSummarySchema,
);
export const adminJobDetailResponseSchema = adminJobSummarySchema.extend({
  description: z.string(),
  responsibilities: z.string().nullable(),
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
  salaryCurrency: z.string(),
  openings: z.number().int().positive(),
  addressLine: z.string().nullable(),
  districtName: z.string().nullable(),
  moderationNote: z.string().nullable(),
  publishedAt: z.iso.datetime().nullable(),
});
export const adminJobModerationDecisionSchema = z.strictObject({
  decision: z.enum(["APPROVE", "REJECT", "HIDE", "RESTORE", "REMOVE"]),
  reason: z.string().trim().min(1).max(2000),
});
export const adminJobModerationDecisionResponseSchema = z.strictObject({
  id: z.uuid(),
  status: jobStatusSchema,
  moderationNote: z.string(),
  moderatedAt: z.iso.datetime(),
});
export type AdminJobModerationQuery = z.infer<
  typeof adminJobModerationQuerySchema
>;
export type AdminJobModerationDecision = z.infer<
  typeof adminJobModerationDecisionSchema
>;
export type AdminJobListResponse = z.infer<typeof adminJobListResponseSchema>;
export type AdminJobDetailResponse = z.infer<
  typeof adminJobDetailResponseSchema
>;
export type AdminJobModerationDecisionResponse = z.infer<
  typeof adminJobModerationDecisionResponseSchema
>;

const reportStatusSchema = z.enum([
  "OPEN",
  "UNDER_REVIEW",
  "ACTION_TAKEN",
  "DISMISSED",
  "CLOSED",
]);
const accountStatusSchema = z.enum([
  "ACTIVE",
  "PENDING",
  "SUSPENDED",
  "DISABLED",
  "DELETED",
]);
const reportReasonSchema = z.enum([
  "FAKE_JOB",
  "FRAUD_OR_SCAM",
  "REQUESTS_MONEY",
  "MISLEADING_INFORMATION",
  "DISCRIMINATION",
  "HARASSMENT_OR_ABUSE",
  "IMPERSONATION",
  "UNSAFE_WORK",
  "SPAM",
  "OTHER",
]);
const reportTargetSchema = z.strictObject({
  job: z
    .strictObject({ id: z.uuid(), title: z.string(), status: jobStatusSchema })
    .nullable(),
  employer: z
    .strictObject({ id: z.uuid(), businessName: z.string().nullable() })
    .nullable(),
  user: z
    .strictObject({
      id: z.uuid(),
      name: z.string().nullable(),
      email: z.string().email(),
      status: accountStatusSchema,
    })
    .nullable(),
});
const adminReportSummarySchema = z.strictObject({
  id: z.uuid(),
  reason: reportReasonSchema,
  status: reportStatusSchema,
  createdAt: z.iso.datetime(),
  reporter: z.strictObject({
    id: z.uuid(),
    name: z.string().nullable(),
    email: z.string().email(),
  }),
  target: reportTargetSchema,
});
export const adminReportQuerySchema = pageQuerySchema.extend({
  status: reportStatusSchema.optional(),
});
export const adminReportListResponseSchema = paginatedResponseSchema(
  adminReportSummarySchema,
);
export const adminReportDetailResponseSchema = adminReportSummarySchema.extend({
  description: z.string().nullable(),
  reviewNote: z.string().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  reviewedBy: z
    .strictObject({
      id: z.uuid(),
      name: z.string().nullable(),
      email: z.string().email(),
    })
    .nullable(),
});
export const adminReportUpdateSchema = z.strictObject({
  status: reportStatusSchema,
  reviewNote: z.string().trim().min(1).max(2000),
});
export const adminReportUpdateResponseSchema = z.strictObject({
  id: z.uuid(),
  status: reportStatusSchema,
  reviewNote: z.string().nullable(),
  reviewedAt: z.iso.datetime(),
});
export type AdminReportQuery = z.infer<typeof adminReportQuerySchema>;
export type AdminReportUpdate = z.infer<typeof adminReportUpdateSchema>;
export type AdminReportListResponse = z.infer<
  typeof adminReportListResponseSchema
>;
export type AdminReportDetailResponse = z.infer<
  typeof adminReportDetailResponseSchema
>;
export type AdminReportUpdateResponse = z.infer<
  typeof adminReportUpdateResponseSchema
>;

export const adminAuditLogQuerySchema = pageQuerySchema
  .extend({
    actorId: z.uuid().optional(),
    action: z.string().trim().min(1).max(100).optional(),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: z.string().trim().min(1).max(100).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .superRefine((query, context) => {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "The end date must not precede the start date",
      });
    }
  });
export const adminAuditLogListResponseSchema = paginatedResponseSchema(
  z.strictObject({
    id: z.uuid(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().nullable(),
    metadata: z.unknown().nullable(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.iso.datetime(),
    actor: z
      .strictObject({
        id: z.uuid(),
        name: z.string().nullable(),
        email: z.string().email(),
      })
      .nullable(),
  }),
);
export type AdminAuditLogQuery = z.infer<typeof adminAuditLogQuerySchema>;
export type AdminAuditLogListResponse = z.infer<
  typeof adminAuditLogListResponseSchema
>;
