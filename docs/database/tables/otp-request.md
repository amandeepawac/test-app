# `otp_requests` (`OtpRequest`)

## Use case

Stores phone one-time-password challenges for future phone verification or
account recovery flows. It is not the mechanism for Google sign-in.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary OTP request identifier. |
| `phone` | `String` (max 20 chars) | Phone number being verified or recovered. |
| `codeHash` | `String` | Hash of the one-time code, not the raw code. |
| `purpose` | `OtpPurpose` | Flow the code is valid for. |
| `expiresAt` | `DateTime` | Latest time the code may be used. |
| `consumedAt` | `DateTime?` | Consumption time; null means not yet consumed. |
| `attempts` | `Int` (default 0) | Number of validation attempts. |
| `createdAt` | `DateTime` (default now) | Request creation time. |

## Relations

- No Prisma relation is declared for this model.

## Constraints and indexes

- Indexes support recent requests by phone and purpose and queries by expiry.
- Apply rate limits and attempt limits in the application layer.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
