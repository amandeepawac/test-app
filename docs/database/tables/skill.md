# `skills` (`Skill`)

## Use case

Defines reusable skills that job seekers can associate with their profiles
and employers can request for jobs.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary skill identifier. |
| `name` | `String` | Display name. |
| `slug` | `String` (unique) | Stable, URL-friendly skill identifier. |
| `description` | `String?` | Optional skill definition. |
| `isActive` | `Boolean` (default `true`) | Whether the skill is available for selection. |
| `createdAt` | `DateTime` (default now) | Record creation time. |
| `updatedAt` | `DateTime` (auto-updated) | Last record update time. |

## Relations

- Has many `SeekerSkill` and `JobSkill` associations.

## Constraints and indexes

- `slug` is unique.
- Index on `(isActive, name)` supports listing active skills by name.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
