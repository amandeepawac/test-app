# `users` (`User`)

## Use case

Stores the platform identity shared by job seekers, employers, and
administrators. A user can have an optional seeker profile and an optional
employer profile; role-based access should be enforced in application logic.

## Scalar fields

| Field               | Prisma type                           | Purpose                                                     |
| ------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `id`                | `String` (UUID, generated)            | Primary account identifier.                                 |
| `email`             | `String` (unique)                     | Account email and sign-in identifier.                       |
| `emailVerifiedAt`   | `DateTime?`                           | When email ownership was verified; null means not verified. |
| `name`              | `String?`                             | Display name.                                               |
| `avatarUrl`         | `String?`                             | URL for the account avatar.                                 |
| `primaryRole`       | `UserRole` (default `JOB_SEEKER`)     | Primary application role.                                   |
| `status`            | `AccountStatus` (default `ACTIVE`)    | Account lifecycle and access status.                        |
| `preferredLanguage` | `String` (default `pa`, max 10 chars) | Preferred interface locale.                                 |
| `phone`             | `String?` (unique, max 20 chars)      | Optional phone number.                                      |
| `lastLoginAt`       | `DateTime?`                           | Most recent successful login time.                          |
| `createdAt`         | `DateTime` (default now)              | Account creation time.                                      |
| `updatedAt`         | `DateTime` (auto-updated)             | Last account record update.                                 |
| `deletedAt`         | `DateTime?`                           | Soft-deletion timestamp, if deleted.                        |
| `anonymizedAt`      | `DateTime?`                           | When direct account identifiers were anonymized.            |

## Relations

- One optional `PasswordCredential`, `SeekerProfile`, and `EmployerProfile`.
- Many `UserAuthProvider` identities, at most one per provider.
- Many sessions, email-verification tokens, password-reset tokens, and notifications.
- Actor/target relations to reports, audit logs, reviews, job moderation, and
  application status history.
- Many `AccountDeletionRequest` records track requested, confirmed, processing,
  and terminal deletion outcomes.

## Constraints and indexes

- `email` and `phone` are unique; nullable unique fields allow
  accounts without those optional values.
- Indexes support role/status queries and account-creation-time queries.
- `DELETION_PENDING` blocks access while a confirmed deletion is processed;
  `DELETED` marks the anonymized account tombstone. Keep the user row so
  retained application and audit history does not cascade away.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
