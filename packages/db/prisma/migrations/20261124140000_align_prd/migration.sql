BEGIN;

CREATE TYPE "AuthProvider" AS ENUM ('EMAIL_PASSWORD', 'GOOGLE');

CREATE TABLE "user_auth_providers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_auth_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_auth_providers_provider_providerUserId_key"
    ON "user_auth_providers"("provider", "providerUserId");
CREATE UNIQUE INDEX "user_auth_providers_userId_provider_key"
    ON "user_auth_providers"("userId", "provider");
ALTER TABLE "user_auth_providers"
    ADD CONSTRAINT "user_auth_providers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep email identities stable if the account email changes.
INSERT INTO "user_auth_providers" ("id", "userId", "provider", "providerUserId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "userId", 'EMAIL_PASSWORD', "userId"::text, "createdAt", "updatedAt"
FROM "password_credentials";

INSERT INTO "user_auth_providers" ("id", "userId", "provider", "providerUserId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", 'GOOGLE', "googleSubject", "createdAt", "updatedAt"
FROM "users"
WHERE "googleSubject" IS NOT NULL;

DROP INDEX "users_googleSubject_key";
ALTER TABLE "users" DROP COLUMN "googleSubject";
ALTER TABLE "seeker_profiles" ADD COLUMN "educationSummary" TEXT;
ALTER TYPE "JobStatus" ADD VALUE 'FILLED' AFTER 'CLOSED';

COMMIT;
