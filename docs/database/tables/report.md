# `reports` (`Report`)

## Use case

Records user-submitted reports about jobs, employers, or users and the
administrative review outcome.

## Scalar fields

| Field              | Prisma type                     | Purpose                                    |
| ------------------ | ------------------------------- | ------------------------------------------ |
| `id`               | `String` (UUID, generated)      | Primary report identifier.                 |
| `reporterId`       | `String` (UUID)                 | User who filed the report.                 |
| `targetJobId`      | `String?` (UUID)                | Optional reported job.                     |
| `targetEmployerId` | `String?` (UUID)                | Optional reported employer profile.        |
| `targetUserId`     | `String?` (UUID)                | Optional reported user.                    |
| `reason`           | `ReportReason`                  | Structured reason for the report.          |
| `description`      | `String?`                       | Optional details supplied by the reporter. |
| `status`           | `ReportStatus` (default `OPEN`) | Current moderation/review state.           |
| `reviewedById`     | `String?` (UUID)                | User who reviewed the report.              |
| `reviewNote`       | `String?`                       | Optional internal review outcome or note.  |
| `reviewedAt`       | `DateTime?`                     | Time the report was reviewed.              |
| `createdAt`        | `DateTime` (default now)        | Report creation time.                      |
| `updatedAt`        | `DateTime` (auto-updated)       | Last report update time.                   |

## Relations

- Belongs to one reporter `User`; deleting that account cascades to its filed
  reports.
- Optional target relations to `Job`, `EmployerProfile`, and `User` use
  `SetNull` on target deletion.
- Optional reviewer relation to `User` uses `SetNull` on reviewer deletion.

## Constraints and indexes

- Indexes support moderation queues by status/time, reporter history, and
  lookup by each optional target.
- The schema permits zero or multiple target IDs; enforce the intended
  target-selection rule in application logic if reports must target exactly
  one entity.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
