# `job_categories` (`JobCategory`)

## Use case

Maintains a selectable, hierarchical taxonomy for classifying jobs and
filtering job discovery results.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary category identifier. |
| `name` | `String` | Display name. |
| `slug` | `String` (unique) | Stable, URL-friendly category identifier. |
| `description` | `String?` | Optional explanation of the category. |
| `parentId` | `String?` (UUID) | Optional parent category. |
| `isActive` | `Boolean` (default `true`) | Whether the category is selectable. |
| `sortOrder` | `Int` (default 0) | Relative display ordering. |
| `createdAt` | `DateTime` (default now) | Record creation time. |
| `updatedAt` | `DateTime` (auto-updated) | Last record update time. |

## Relations

- Optional self-relation to a parent category; deleting a parent sets
  `parentId` to null.
- Has child categories and related `Job` records.

## Constraints and indexes

- `slug` is unique.
- Index on `(parentId, isActive)` supports active category-tree queries.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
