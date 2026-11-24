# `job_applications` (`JobApplication`)

## Use case

Records a job seeker's application to a job, its current review status, and
optional messages. It is the parent record for application status history.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary application identifier. |
| `jobId` | `String` (UUID) | Job being applied to. |
| `seekerProfileId` | `String` (UUID) | Job-seeker profile submitting the application. |
| `status` | `ApplicationStatus` (default `APPLIED`) | Current application state. |
| `coverMessage` | `String?` | Optional message supplied by the applicant. |
| `employerNote` | `String?` | Optional employer-side note. |
| `appliedAt` | `DateTime` (default now) | Application submission time. |
| `updatedAt` | `DateTime` (auto-updated) | Last application update time. |
| `withdrawnAt` | `DateTime?` | Time the applicant withdrew, if applicable. |

## Relations

- Belongs to one `Job` and one `SeekerProfile`; deleting either cascades to
  the application.
- Has many `ApplicationStatusHistory` records; deleting the application
  cascades to its history.

## Constraints and indexes

- `(jobId, seekerProfileId)` is unique, preventing duplicate applications
  from the same seeker to the same job.
- Indexes support seeker application history and employer applicant lists,
  ordered/filterable by status and application time.
- Create the application and its initial history entry atomically in the
  application layer.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
