# `password_reset_tokens` (`PasswordResetToken`)

## Use case

Tracks single-use password-recovery challenges. The stored token is a hash,
not the raw reset secret.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary token-record identifier. |
| `userId` | `String` (UUID) | Account allowed to reset its password. |
| `tokenHash` | `String` (unique) | Hash used to validate the presented reset token. |
| `expiresAt` | `DateTime` | Latest time the token may be used. |
| `consumedAt` | `DateTime?` | Consumption time; null means not yet consumed. |
| `createdAt` | `DateTime` (default now) | Token-record creation time. |

## Relations

- Belongs to one `User`; deleting the user cascades to these token records.

## Constraints and indexes

- `tokenHash` is unique.
- Indexes support a user's tokens by expiry and queries by expiry.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
