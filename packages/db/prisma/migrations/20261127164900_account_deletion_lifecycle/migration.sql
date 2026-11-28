CREATE TYPE "AccountDeletionRequestStatus" AS ENUM (
    'REQUESTED',
    'CONFIRMED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
);

ALTER TABLE "users"
ADD COLUMN "anonymizedAt" TIMESTAMP(3);

CREATE TABLE "account_deletion_requests" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "status" "AccountDeletionRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "failureCode" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_deletion_requests_userId_requestedAt_idx"
ON "account_deletion_requests"("userId", "requestedAt");

CREATE INDEX "account_deletion_requests_status_requestedAt_idx"
ON "account_deletion_requests"("status", "requestedAt");

ALTER TABLE "account_deletion_requests"
ADD CONSTRAINT "account_deletion_requests_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
