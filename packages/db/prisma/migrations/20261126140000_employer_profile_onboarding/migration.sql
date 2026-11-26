ALTER TABLE "employer_profiles"
  ALTER COLUMN "employerType" DROP NOT NULL,
  ALTER COLUMN "employerType" DROP DEFAULT,
  ALTER COLUMN "businessName" DROP NOT NULL,
  ADD COLUMN "showEmail" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "showPhone" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "completedAt" TIMESTAMP(3);

UPDATE "employer_profiles"
SET "completedAt" = "updatedAt"
WHERE NULLIF(TRIM("businessName"), '') IS NOT NULL
  AND "employerType" IS NOT NULL
  AND NULLIF(TRIM("contactPersonName"), '') IS NOT NULL
  AND NULLIF(TRIM("businessPhone"), '') IS NOT NULL
  AND NULLIF(TRIM("stateName"), '') IS NOT NULL
  AND NULLIF(TRIM("cityName"), '') IS NOT NULL;
