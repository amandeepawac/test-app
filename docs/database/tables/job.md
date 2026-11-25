# `jobs` (`Job`)

## Use case

Stores employer-created vacancies, their search/display information, location,
compensation, publication lifecycle, and moderation metadata.

## Scalar fields

| Field                | Prisma type                                 | Purpose                                        |
| -------------------- | ------------------------------------------- | ---------------------------------------------- |
| `id`                 | `String` (UUID, generated)                  | Primary job identifier.                        |
| `employerId`         | `String` (UUID)                             | Employer profile that owns the job.            |
| `categoryId`         | `String?` (UUID)                            | Optional job category.                         |
| `locationId`         | `String?` (UUID)                            | Optional normalized location reference.        |
| `title`              | `String`                                    | Job title.                                     |
| `slug`               | `String?`                                   | Optional URL-friendly identifier.              |
| `description`        | `String`                                    | Main job description.                          |
| `responsibilities`   | `String?`                                   | Optional duties and responsibilities.          |
| `employmentType`     | `EmploymentType`                            | Employment arrangement.                        |
| `workMode`           | `WorkMode` (default `ON_SITE`)              | On-site, remote, or hybrid work mode.          |
| `experienceLevel`    | `ExperienceLevel` (default `NO_EXPERIENCE`) | Expected experience category.                  |
| `salaryMin`          | `Decimal?` (12,2)                           | Optional lower salary bound.                   |
| `salaryMax`          | `Decimal?` (12,2)                           | Optional upper salary bound.                   |
| `salaryPeriod`       | `SalaryPeriod` (default `MONTH`)            | Period represented by salary amounts.          |
| `salaryCurrency`     | `String` (default `INR`, max 3 chars)       | Currency code for salary amounts.              |
| `isSalaryNegotiable` | `Boolean` (default `false`)                 | Whether compensation is negotiable.            |
| `openings`           | `Int` (default 1)                           | Number of vacancies.                           |
| `addressLine`        | `String?`                                   | Street-level work location.                    |
| `localityName`       | `String?`                                   | Locality name.                                 |
| `cityName`           | `String?`                                   | City name.                                     |
| `districtName`       | `String?`                                   | District name.                                 |
| `stateName`          | `String?`                                   | State name.                                    |
| `postalCode`         | `String?` (max 12 chars)                    | Postal code.                                   |
| `latitude`           | `Decimal?` (10,7)                           | Optional work-location latitude.               |
| `longitude`          | `Decimal?` (10,7)                           | Optional work-location longitude.              |
| `workingHours`       | `String?`                                   | Optional expected working hours.               |
| `shiftDetails`       | `String?`                                   | Optional shift information.                    |
| `isUrgent`           | `Boolean` (default `false`)                 | Whether the employer marks the vacancy urgent. |
| `status`             | `JobStatus` (default `DRAFT`)               | Job publication/moderation lifecycle state.    |
| `moderationNote`     | `String?`                                   | Reviewer note about moderation.                |
| `moderatedById`      | `String?` (UUID)                            | User who moderated the job.                    |
| `moderatedAt`        | `DateTime?`                                 | Time of the latest moderation action.          |
| `publishedAt`        | `DateTime?`                                 | Time the job was published.                    |
| `expiresAt`          | `DateTime?`                                 | Time after which the listing expires.          |
| `closedAt`           | `DateTime?`                                 | Time the listing was closed.                   |
| `createdAt`          | `DateTime` (default now)                    | Job creation time.                             |
| `updatedAt`          | `DateTime` (auto-updated)                   | Last job update time.                          |

## Relations

- Belongs to one `EmployerProfile`; deleting that profile cascades to its jobs.
- Optional `JobCategory`, `Location`, and moderator `User` relations use
  `SetNull` on delete.
- Has many `JobSkill`, `JobApplication`, `SavedJob`, and `Report` records.

## Constraints and indexes

- Indexes support job feeds by status/publication time, employer and status,
  category and status, location and status, city/state and status, expiry, and
  urgent/publication ordering.
- The schema does not declare `slug` unique; enforce any required URL
  uniqueness in a later schema change if needed.
- Legal status transitions and public visibility rules belong in application
  logic; a stored status alone does not enforce them.
- `FILLED` distinguishes a filled vacancy from a listing otherwise `CLOSED`.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
