# `audit_logs` (`AuditLog`)

## Use case

Captures administrative or security-relevant actions for traceability. The
event name and entity identifiers are flexible strings so multiple domain
areas can record events.

## Scalar fields

| Field        | Prisma type                | Purpose                                    |
| ------------ | -------------------------- | ------------------------------------------ |
| `id`         | `String` (UUID, generated) | Primary audit-record identifier.           |
| `actorId`    | `String?` (UUID)           | User who performed the action, when known. |
| `action`     | `String`                   | Action/event name.                         |
| `entityType` | `String`                   | Type of entity affected.                   |
| `entityId`   | `String?`                  | Identifier of the affected entity.         |
| `metadata`   | `Json?`                    | Optional structured event context.         |
| `ipAddress`  | `String?` (max 64 chars)   | Client IP address, if captured.            |
| `userAgent`  | `String?`                  | Client user-agent string, if captured.     |
| `createdAt`  | `DateTime` (default now)   | Time the event was recorded.               |

## Relations

- Optional actor relation to `User`; deleting the actor account sets `actorId`
  to null.
- `entityType` and `entityId` are generic identifiers, not foreign keys.

## Constraints and indexes

- Indexes support actor timelines, entity history, and action/time queries.
- Avoid placing passwords, tokens, or sensitive document contents in
  `metadata`; apply access controls and retention rules to audit records.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
