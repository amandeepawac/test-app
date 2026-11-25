# `employer_profiles` (`EmployerProfile`)

## Use case

Stores an employer's public business profile and verification lifecycle. Jobs
are owned by this profile; administrators and employers use the verification
fields to determine publication eligibility.

## Scalar fields

| Field                     | Prisma type                                            | Purpose                                              |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `id`                      | `String` (UUID, generated)                             | Primary employer-profile identifier.                 |
| `userId`                  | `String` (UUID, unique)                                | Owning account; one employer profile per user.       |
| `employerType`            | `EmployerType` (default `OTHER`)                       | Business or employer classification.                 |
| `businessName`            | `String`                                               | Name displayed for the employer.                     |
| `contactPersonName`       | `String?`                                              | Contact representative.                              |
| `businessDescription`     | `String?`                                              | Employer profile description.                        |
| `businessPhone`           | `String?` (max 20 chars)                               | Business contact phone.                              |
| `websiteUrl`              | `String?`                                              | Employer website.                                    |
| `locationId`              | `String?` (UUID)                                       | Optional normalized location reference.              |
| `addressLine`             | `String?`                                              | Business street/address detail.                      |
| `cityName`                | `String?`                                              | Business city name.                                  |
| `districtName`            | `String?`                                              | Business district name.                              |
| `stateName`               | `String?`                                              | Business state name.                                 |
| `postalCode`              | `String?` (max 12 chars)                               | Business postal code.                                |
| `latitude`                | `Decimal?` (10,7)                                      | Optional business latitude.                          |
| `longitude`               | `Decimal?` (10,7)                                      | Optional business longitude.                         |
| `verificationStatus`      | `EmployerVerificationStatus` (default `NOT_SUBMITTED`) | Current verification workflow state.                 |
| `verificationLevel`       | `EmployerVerificationLevel` (default `NONE`)           | Verification tier assigned to the employer.          |
| `verificationSubmittedAt` | `DateTime?`                                            | Submission time of the current verification request. |
| `verifiedAt`              | `DateTime?`                                            | Time verification was approved.                      |
| `verifiedById`            | `String?` (UUID)                                       | User who approved/reviewed verification.             |
| `rejectionReason`         | `String?`                                              | Reason provided when verification is rejected.       |
| `verificationNote`        | `String?`                                              | Review or follow-up note.                            |
| `nextReviewAt`            | `DateTime?`                                            | Optional scheduled verification review time.         |
| `createdAt`               | `DateTime` (default now)                               | Profile creation time.                               |
| `updatedAt`               | `DateTime` (auto-updated)                              | Last profile update time.                            |

## Relations

- Belongs to one `User`; deleting the user cascades to the profile.
- Optional `Location` and `verifiedBy` `User` references use `SetNull` on delete.
- Has many `EmployerDocument`, `Job`, and `Report` records.

## Constraints and indexes

- `userId` is unique.
- Indexes support verification queues, verification tier, location, and
  business-name searches.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
