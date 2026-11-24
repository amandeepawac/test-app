# `auth_sessions` (`AuthSession`)

## Use case

Represents one authenticated device or browser session. Revoking a session
allows logout for that device and invalidates its refresh-token family.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary session identifier. |
| `userId` | `String` (UUID) | Owning account. |
| `userAgent` | `String?` | Client user-agent string for session context. |
| `ipAddress` | `String?` (max 64 chars) | Client IP address recorded for session context. |
| `expiresAt` | `DateTime` | Session expiration time. |
| `revokedAt` | `DateTime?` | Revocation time; null indicates not explicitly revoked. |
| `createdAt` | `DateTime` (default now) | Session creation time. |
| `lastUsedAt` | `DateTime?` | Most recent session use. |

## Relations

- Belongs to one `User`; deleting the user cascades to the session.
- Has many `AuthRefreshToken` records; deleting the session cascades to them.

## Constraints and indexes

- Indexes support listing a user's sessions by expiry and finding sessions by
  expiry or revocation status.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
