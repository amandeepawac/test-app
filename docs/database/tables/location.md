# `locations` (`Location`)

## Use case

Provides normalized, hierarchical geographic values for profiles and job
listings (for example, country, state, district, city, and locality).

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary location identifier. |
| `name` | `String` | Human-readable location name. |
| `slug` | `String?` | Optional URL- or lookup-friendly identifier within a parent. |
| `type` | `LocationType` | Geographic level, such as state or city. |
| `parentId` | `String?` (UUID) | Optional parent location in the hierarchy. |
| `countryCode` | `String?` (max 2 chars) | Optional ISO-style country code. |
| `latitude` | `Decimal?` (10,7) | Optional geographic latitude. |
| `longitude` | `Decimal?` (10,7) | Optional geographic longitude. |
| `isActive` | `Boolean` (default `true`) | Whether the location is available for selection. |
| `createdAt` | `DateTime` (default now) | Record creation time. |
| `updatedAt` | `DateTime` (auto-updated) | Last record update time. |

## Relations

- Optional self-relation to a parent `Location`; deleting a parent sets child
  `parentId` to null.
- Has child locations and may be referenced by seeker profiles, employer
  profiles, and jobs. Those optional references are set to null when this
  location is deleted.

## Constraints and indexes

- `(parentId, slug)` is unique, allowing sibling locations to use distinct
  slugs.
- Indexes support browsing by location type/name and traversing by parent.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
