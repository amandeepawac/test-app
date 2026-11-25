# `application_status_histories` (`ApplicationStatusHistory`)

## Use case

Provides an append-oriented record of application status changes, including
the prior state, new state, actor, optional note, and change time.

## Scalar fields

| Field           | Prisma type                | Purpose                                                  |
| --------------- | -------------------------- | -------------------------------------------------------- |
| `id`            | `String` (UUID, generated) | Primary history-record identifier.                       |
| `applicationId` | `String` (UUID)            | Application whose status changed.                        |
| `oldStatus`     | `ApplicationStatus?`       | Previous status; nullable for the initial history entry. |
| `newStatus`     | `ApplicationStatus`        | Status after the change.                                 |
| `changedById`   | `String?` (UUID)           | User responsible for the change, if recorded.            |
| `note`          | `String?`                  | Optional explanation or message for the transition.      |
| `createdAt`     | `DateTime` (default now)   | Time the status change was recorded.                     |

## Relations

- Belongs to one `JobApplication`; deleting the application cascades to its
  history.
- Optional `changedBy` relation to `User` uses `SetNull` on account deletion.

## Constraints and indexes

- Indexes support an application's ordered history and history lookup by actor.
- The schema does not enforce that `newStatus` is a legal transition from
  `oldStatus`; validate transitions in application logic.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
