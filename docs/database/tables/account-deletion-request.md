# `account_deletion_requests` (`AccountDeletionRequest`)

## Use case

Tracks an account deletion request from submission through confirmation,
processing, and a terminal outcome. The request is a minimal operational
record; it remains available if a user row is later purged under an approved
retention policy.

## Scalar fields

| Field                 | Prisma type                    | Purpose                                         |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `id`                  | `String` (UUID, generated)     | Request identifier.                             |
| `userId`              | `String?` (UUID)               | Request owner; nullable to preserve the record. |
| `status`              | `AccountDeletionRequestStatus` | Current workflow state.                         |
| `requestedAt`         | `DateTime` (default now)       | When deletion was requested.                    |
| `confirmedAt`         | `DateTime?`                    | When the user confirmed the request.            |
| `processingStartedAt` | `DateTime?`                    | When anonymization and cleanup began.           |
| `completedAt`         | `DateTime?`                    | When anonymization completed.                   |
| `cancelledAt`         | `DateTime?`                    | When the request was cancelled.                 |
| `attemptCount`        | `Int` (default 0)              | Processing attempts for safe retries.           |
| `failureCode`         | `String?` (max 100 chars)      | Non-sensitive code describing a failed attempt. |
| `createdAt`           | `DateTime` (default now)       | Record creation time.                           |
| `updatedAt`           | `DateTime` (auto-updated)      | Last request update.                            |

## Relations and indexes

- Optional relation to `User`; deleting the user sets `userId` to null instead
  of cascading away the request record.
- Indexes support a user's request history and worker polling by status/time.

The status sequence and deletion policy are documented in the
[revised PRD](../../RozgarLocal-PRD-Revised.md#69-account-deletion). Exact
retention periods still require privacy/legal approval.
