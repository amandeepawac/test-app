# `seeker_profiles` (`SeekerProfile`)

## Use case

Stores job-seeker information used for profile completion, job matching,
applications, and saved jobs. Identity and sign-in details remain in `User`.

## Scalar fields

| Field                      | Prisma type                                 | Purpose                                      |
| -------------------------- | ------------------------------------------- | -------------------------------------------- |
| `id`                       | `String` (UUID, generated)                  | Primary profile identifier.                  |
| `userId`                   | `String` (UUID, unique)                     | Owning account; one seeker profile per user. |
| `fullName`                 | `String?`                                   | Name presented on the job-seeker profile.    |
| `headline`                 | `String?`                                   | Short professional headline.                 |
| `bio`                      | `String?`                                   | Profile summary.                             |
| `profilePhotoUrl`          | `String?`                                   | Profile photo URL.                           |
| `locationId`               | `String?` (UUID)                            | Optional normalized location reference.      |
| `addressText`              | `String?`                                   | Free-form address/location detail.           |
| `latitude`                 | `Decimal?` (10,7)                           | Optional geographic latitude.                |
| `longitude`                | `Decimal?` (10,7)                           | Optional geographic longitude.               |
| `experienceLevel`          | `ExperienceLevel` (default `NO_EXPERIENCE`) | Broad experience category.                   |
| `experienceSummary`        | `String?`                                   | Free-form work or experience summary.        |
| `educationSummary`         | `String?`                                   | Optional free-form education summary.        |
| `expectedSalaryMin`        | `Decimal?` (12,2)                           | Lower expected salary bound.                 |
| `expectedSalaryMax`        | `Decimal?` (12,2)                           | Upper expected salary bound.                 |
| `salaryPeriod`             | `SalaryPeriod?`                             | Period used for expected salary amounts.     |
| `preferredEmploymentTypes` | `EmploymentType[]` (default `[]`)           | Employment types the seeker prefers.         |
| `isAvailable`              | `Boolean` (default `true`)                  | Whether the seeker is currently available.   |
| `availabilityNote`         | `String?`                                   | Additional availability details.             |
| `createdAt`                | `DateTime` (default now)                    | Profile creation time.                       |
| `updatedAt`                | `DateTime` (auto-updated)                   | Last profile update time.                    |

## Relations

- Belongs to one `User`; deleting the user cascades to the profile.
- Optional `Location` relation uses `SetNull` when the location is deleted.
- Has many `SeekerSkill`, `JobApplication`, and `SavedJob` records.

## Constraints and indexes

- `userId` is unique.
- Indexes support location lookup and availability/experience filtering.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
