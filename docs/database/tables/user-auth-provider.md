# `user_auth_providers` (`UserAuthProvider`)

## Use case

Stores identities linked to an account for email/password and Google sign-in.
Google identities use the stable Google subject as `providerUserId`. For
email/password, `providerUserId` is the user's UUID as text, not the mutable
email address. Password hashes remain in `PasswordCredential`. Registration
and linking must create the corresponding identity and credential atomically
where applicable, and must verify identity ownership before linking accounts.

## Scalar fields

| Field            | Prisma type                | Purpose                               |
| ---------------- | -------------------------- | ------------------------------------- |
| `id`             | `String` (UUID, generated) | Primary provider identity identifier. |
| `userId`         | `String` (UUID)            | Account owning the identity.          |
| `provider`       | `AuthProvider`             | `EMAIL_PASSWORD` or `GOOGLE`.         |
| `providerUserId` | `String`                   | Stable identity within the provider.  |
| `createdAt`      | `DateTime` (default now)   | Identity creation time.               |
| `updatedAt`      | `DateTime` (auto-updated)  | Last identity update time.            |

## Relations and constraints

- Belongs to one `User`; deleting the account cascades to its identities.
- `(provider, providerUserId)` and `(userId, provider)` are unique.
- The database does not enforce correspondence between email/password
  identities and password credentials; the authentication service must do so.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
