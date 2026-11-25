# `password_credentials` (`PasswordCredential`)

## Use case

Stores a user's password verifier separately from general profile data. The
password value must be a secure hash, never a plaintext password.

## Scalar fields

| Field               | Prisma type                | Purpose                                                        |
| ------------------- | -------------------------- | -------------------------------------------------------------- |
| `id`                | `String` (UUID, generated) | Primary credential identifier.                                 |
| `userId`            | `String` (UUID, unique)    | Account owning this credential; enforces at most one per user. |
| `passwordHash`      | `String`                   | Password hash produced by the authentication layer.            |
| `passwordChangedAt` | `DateTime` (default now)   | Time the current password was set or changed.                  |
| `createdAt`         | `DateTime` (default now)   | Credential creation time.                                      |
| `updatedAt`         | `DateTime` (auto-updated)  | Last credential update time.                                   |

## Relations

- Belongs to one `User`; deleting the account cascades to this credential.

## Constraints and indexes

- `userId` is unique, so a user has no more than one password credential.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
