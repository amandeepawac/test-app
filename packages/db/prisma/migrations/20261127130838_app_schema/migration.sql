-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('JOB_SEEKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL_PASSWORD', 'GOOGLE');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('SIGN_IN', 'PHONE_VERIFICATION', 'ACCOUNT_RECOVERY');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('COUNTRY', 'STATE', 'DISTRICT', 'CITY', 'LOCALITY');

-- CreateEnum
CREATE TYPE "EmployerType" AS ENUM ('COMPANY', 'SMALL_BUSINESS', 'SHOP', 'FACTORY', 'RESTAURANT', 'CONTRACTOR', 'NON_PROFIT', 'HOUSEHOLD', 'INDIVIDUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployerVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_MORE_INFO', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmployerVerificationLevel" AS ENUM ('NONE', 'BASIC', 'BUSINESS', 'TRUSTED');

-- CreateEnum
CREATE TYPE "EmployerDocumentType" AS ENUM ('GST_CERTIFICATE', 'UDYAM_CERTIFICATE', 'SHOP_ESTABLISHMENT_REGISTRATION', 'TRADE_LICENSE', 'INCORPORATION_CERTIFICATE', 'BUSINESS_ADDRESS_PROOF', 'BUSINESS_BANK_PROOF', 'FSSAI_LICENSE', 'REPRESENTATIVE_AUTHORIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'DAILY_WAGE', 'APPRENTICESHIP', 'INTERNSHIP', 'FREELANCE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ON_SITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR', 'FIXED', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('NO_EXPERIENCE', 'ENTRY_LEVEL', 'LESS_THAN_1_YEAR', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'FIVE_TO_TEN_YEARS', 'TEN_PLUS_YEARS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'HIDDEN', 'REJECTED', 'CLOSED', 'FILLED', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'REVIEWING', 'SHORTLISTED', 'CONTACTED', 'REJECTED', 'HIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'NEW_APPLICATION_RECEIVED', 'EMPLOYER_VERIFICATION_SUBMITTED', 'EMPLOYER_VERIFICATION_APPROVED', 'EMPLOYER_VERIFICATION_REJECTED', 'EMPLOYER_VERIFICATION_NEEDS_INFO', 'JOB_APPROVED', 'JOB_REJECTED', 'JOB_PAUSED', 'JOB_REMOVED', 'ACCOUNT_NOTICE', 'SAFETY_NOTICE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FAKE_JOB', 'FRAUD_OR_SCAM', 'REQUESTS_MONEY', 'MISLEADING_INFORMATION', 'DISCRIMINATION', 'HARASSMENT_OR_ABUSE', 'IMPERSONATION', 'UNSAFE_WORK', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'CLOSED');

-- CreateTable
CREATE TABLE "auth_rate_limits" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "name" TEXT,
    "avatarUrl" TEXT,
    "primaryRole" "UserRole" NOT NULL DEFAULT 'JOB_SEEKER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "preferredLanguage" VARCHAR(10) NOT NULL DEFAULT 'pa',
    "phone" VARCHAR(20),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth_providers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_auth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userAgent" TEXT,
    "ipAddress" VARCHAR(64),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_credentials" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pendingPasswordHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refresh_tokens" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seeker_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT,
    "headline" TEXT,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "locationId" UUID,
    "stateName" TEXT,
    "cityName" TEXT,
    "addressText" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "experienceLevel" "ExperienceLevel",
    "experienceSummary" TEXT,
    "educationSummary" TEXT,
    "expectedSalaryMin" DECIMAL(12,2),
    "expectedSalaryMax" DECIMAL(12,2),
    "salaryPeriod" "SalaryPeriod",
    "preferredEmploymentTypes" "EmploymentType"[] DEFAULT ARRAY[]::"EmploymentType"[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availabilityNote" TEXT,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seeker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employerType" "EmployerType",
    "businessName" TEXT,
    "contactPersonName" TEXT,
    "businessDescription" TEXT,
    "businessPhone" VARCHAR(20),
    "websiteUrl" TEXT,
    "locationId" UUID,
    "addressLine" TEXT,
    "cityName" TEXT,
    "districtName" TEXT,
    "stateName" TEXT,
    "postalCode" VARCHAR(12),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "verificationStatus" "EmployerVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "verificationLevel" "EmployerVerificationLevel" NOT NULL DEFAULT 'NONE',
    "verificationSubmittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" UUID,
    "rejectionReason" TEXT,
    "verificationNote" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_documents" (
    "id" UUID NOT NULL,
    "employerId" UUID NOT NULL,
    "documentType" "EmployerDocumentType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" VARCHAR(120),
    "fileSizeBytes" BIGINT,
    "documentNumber" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewStatus" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "type" "LocationType" NOT NULL,
    "parentId" UUID,
    "countryCode" VARCHAR(2),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seeker_skills" (
    "id" UUID NOT NULL,
    "seekerProfileId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "experienceYears" DECIMAL(4,1),
    "proficiencyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seeker_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "employerId" UUID NOT NULL,
    "categoryId" UUID,
    "locationId" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT,
    "employmentType" "EmploymentType" NOT NULL,
    "workMode" "WorkMode" NOT NULL DEFAULT 'ON_SITE',
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'NO_EXPERIENCE',
    "salaryMin" DECIMAL(12,2),
    "salaryMax" DECIMAL(12,2),
    "salaryPeriod" "SalaryPeriod" NOT NULL DEFAULT 'MONTH',
    "salaryCurrency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "isSalaryNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "addressLine" TEXT,
    "localityName" TEXT,
    "cityName" TEXT,
    "districtName" TEXT,
    "stateName" TEXT,
    "postalCode" VARCHAR(12),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "workingHours" TEXT,
    "shiftDetails" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "moderationNote" TEXT,
    "moderatedById" UUID,
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "seekerProfileId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "coverMessage" TEXT,
    "employerNote" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_histories" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "oldStatus" "ApplicationStatus",
    "newStatus" "ApplicationStatus" NOT NULL,
    "changedById" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" UUID NOT NULL,
    "seekerProfileId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" UUID,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "targetJobId" UUID,
    "targetEmployerId" UUID,
    "targetUserId" UUID,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" UUID,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_rate_limits_expiresAt_idx" ON "auth_rate_limits"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_primaryRole_status_idx" ON "users"("primaryRole", "status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_providers_provider_providerUserId_key" ON "user_auth_providers"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_providers_userId_provider_key" ON "user_auth_providers"("userId", "provider");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_expiresAt_idx" ON "auth_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_sessions_revokedAt_idx" ON "auth_sessions"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_credentials_userId_key" ON "password_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_expiresAt_idx" ON "email_verification_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_tokens_tokenHash_key" ON "auth_refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_sessionId_expiresAt_idx" ON "auth_refresh_tokens"("sessionId", "expiresAt");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_expiresAt_idx" ON "auth_refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_consumedAt_idx" ON "auth_refresh_tokens"("consumedAt");

-- CreateIndex
CREATE INDEX "otp_requests_phone_purpose_createdAt_idx" ON "otp_requests"("phone", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "otp_requests_expiresAt_idx" ON "otp_requests"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "seeker_profiles_userId_key" ON "seeker_profiles"("userId");

-- CreateIndex
CREATE INDEX "seeker_profiles_locationId_idx" ON "seeker_profiles"("locationId");

-- CreateIndex
CREATE INDEX "seeker_profiles_isAvailable_experienceLevel_idx" ON "seeker_profiles"("isAvailable", "experienceLevel");

-- CreateIndex
CREATE UNIQUE INDEX "employer_profiles_userId_key" ON "employer_profiles"("userId");

-- CreateIndex
CREATE INDEX "employer_profiles_verificationStatus_createdAt_idx" ON "employer_profiles"("verificationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "employer_profiles_verificationLevel_idx" ON "employer_profiles"("verificationLevel");

-- CreateIndex
CREATE INDEX "employer_profiles_locationId_idx" ON "employer_profiles"("locationId");

-- CreateIndex
CREATE INDEX "employer_profiles_businessName_idx" ON "employer_profiles"("businessName");

-- CreateIndex
CREATE INDEX "employer_documents_employerId_reviewStatus_idx" ON "employer_documents"("employerId", "reviewStatus");

-- CreateIndex
CREATE INDEX "employer_documents_documentType_idx" ON "employer_documents"("documentType");

-- CreateIndex
CREATE INDEX "employer_documents_expiresAt_idx" ON "employer_documents"("expiresAt");

-- CreateIndex
CREATE INDEX "locations_type_name_idx" ON "locations"("type", "name");

-- CreateIndex
CREATE INDEX "locations_parentId_idx" ON "locations"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "locations_parentId_slug_key" ON "locations"("parentId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_slug_key" ON "job_categories"("slug");

-- CreateIndex
CREATE INDEX "job_categories_parentId_isActive_idx" ON "job_categories"("parentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_isActive_name_idx" ON "skills"("isActive", "name");

-- CreateIndex
CREATE INDEX "seeker_skills_skillId_idx" ON "seeker_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "seeker_skills_seekerProfileId_skillId_key" ON "seeker_skills"("seekerProfileId", "skillId");

-- CreateIndex
CREATE INDEX "job_skills_skillId_idx" ON "job_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_skills_jobId_skillId_key" ON "job_skills"("jobId", "skillId");

-- CreateIndex
CREATE INDEX "jobs_status_publishedAt_idx" ON "jobs"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "jobs_employerId_status_idx" ON "jobs"("employerId", "status");

-- CreateIndex
CREATE INDEX "jobs_categoryId_status_idx" ON "jobs"("categoryId", "status");

-- CreateIndex
CREATE INDEX "jobs_locationId_status_idx" ON "jobs"("locationId", "status");

-- CreateIndex
CREATE INDEX "jobs_cityName_stateName_status_idx" ON "jobs"("cityName", "stateName", "status");

-- CreateIndex
CREATE INDEX "jobs_expiresAt_idx" ON "jobs"("expiresAt");

-- CreateIndex
CREATE INDEX "jobs_isUrgent_status_publishedAt_idx" ON "jobs"("isUrgent", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "job_applications_seekerProfileId_status_appliedAt_idx" ON "job_applications"("seekerProfileId", "status", "appliedAt");

-- CreateIndex
CREATE INDEX "job_applications_jobId_status_appliedAt_idx" ON "job_applications"("jobId", "status", "appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_jobId_seekerProfileId_key" ON "job_applications"("jobId", "seekerProfileId");

-- CreateIndex
CREATE INDEX "application_status_histories_applicationId_createdAt_idx" ON "application_status_histories"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "application_status_histories_changedById_idx" ON "application_status_histories"("changedById");

-- CreateIndex
CREATE INDEX "saved_jobs_jobId_idx" ON "saved_jobs"("jobId");

-- CreateIndex
CREATE INDEX "saved_jobs_seekerProfileId_createdAt_idx" ON "saved_jobs"("seekerProfileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_seekerProfileId_jobId_key" ON "saved_jobs"("seekerProfileId", "jobId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_resourceType_resourceId_idx" ON "notifications"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "reports_reporterId_createdAt_idx" ON "reports"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "reports_targetJobId_idx" ON "reports"("targetJobId");

-- CreateIndex
CREATE INDEX "reports_targetEmployerId_idx" ON "reports"("targetEmployerId");

-- CreateIndex
CREATE INDEX "reports_targetUserId_idx" ON "reports"("targetUserId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "user_auth_providers" ADD CONSTRAINT "user_auth_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_profiles" ADD CONSTRAINT "seeker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_profiles" ADD CONSTRAINT "seeker_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_documents" ADD CONSTRAINT "employer_documents_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_documents" ADD CONSTRAINT "employer_documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_skills" ADD CONSTRAINT "seeker_skills_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_skills" ADD CONSTRAINT "seeker_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetJobId_fkey" FOREIGN KEY ("targetJobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetEmployerId_fkey" FOREIGN KEY ("targetEmployerId") REFERENCES "employer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
