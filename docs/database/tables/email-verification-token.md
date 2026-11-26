# `email_verification_tokens` (`EmailVerificationToken`)

## Use case

Tracks single-use email-verification challenges. Store only a token hash so a
database read does not reveal a usable verification secret.

## Scalar fields

| Field                 | Prisma type                | Purpose                                                               |
| --------------------- | -------------------------- | --------------------------------------------------------------------- |
| `id`                  | `String` (UUID, generated) | Primary token-record identifier.                                      |
| `userId`              | `String` (UUID)            | Account whose email is being verified.                                |
| `tokenHash`           | `String` (unique)          | Hash used to validate the presented verification token.               |
| `pendingPasswordHash` | `String?`                  | Argon2id hash for this registration attempt; cleared on verification. |
| `expiresAt`           | `DateTime`                 | Latest time the token may be used.                                    |
| `consumedAt`          | `DateTime?`                | Consumption time; null means not yet consumed.                        |
| `createdAt`           | `DateTime` (default now)   | Token-record creation time.                                           |

## Relations

- Belongs to one `User`; deleting the user cascades to these token records.

## Constraints and indexes

- `tokenHash` is unique.
- Indexes support looking up a user's unexpired tokens and querying by expiry.
- A verification link activates the password chosen in its registration attempt,
  rather than a password previously submitted for the same unverified email.
  Expired rows should be removed by a retention job.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
