# `auth_refresh_tokens` (`AuthRefreshToken`)

## Use case

Persists hashed refresh tokens for session renewal and rotation. A consumed
token being reused should cause its parent session to be revoked.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary refresh-token record identifier. |
| `sessionId` | `String` (UUID) | Parent authenticated session. |
| `tokenHash` | `String` (unique) | Hash of the refresh secret; do not store the raw token. |
| `expiresAt` | `DateTime` | Token expiration time. |
| `consumedAt` | `DateTime?` | Time this token was rotated/used. |
| `revokedAt` | `DateTime?` | Revocation time, when individually revoked. |
| `createdAt` | `DateTime` (default now) | Token-record creation time. |

## Relations

- Belongs to one `AuthSession`; deleting the session cascades to its tokens.

## Constraints and indexes

- `tokenHash` is unique.
- Indexes support a session's tokens by expiry and queries by expiry or
  consumption status.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
