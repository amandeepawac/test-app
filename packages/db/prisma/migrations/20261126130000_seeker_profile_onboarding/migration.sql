ALTER TABLE "seeker_profiles"
  ADD COLUMN "stateName" TEXT,
  ADD COLUMN "cityName" TEXT,
  ADD COLUMN "showEmail" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "showPhone" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ALTER COLUMN "experienceLevel" DROP NOT NULL,
  ALTER COLUMN "experienceLevel" DROP DEFAULT;
