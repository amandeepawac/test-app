# `saved_jobs` (`SavedJob`)

## Use case

Join table storing jobs bookmarked by job seekers for later viewing.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary saved-job identifier. |
| `seekerProfileId` | `String` (UUID) | Seeker who saved the job. |
| `jobId` | `String` (UUID) | Saved job listing. |
| `createdAt` | `DateTime` (default now) | Time the job was saved. |

## Relations

- Belongs to one `SeekerProfile` and one `Job`.
- Deleting either the profile or job cascades to the saved-job record.

## Constraints and indexes

- `(seekerProfileId, jobId)` is unique, preventing duplicate bookmarks.
- Indexes support listing a seeker's saved jobs by creation time and finding
  saves for a job.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
