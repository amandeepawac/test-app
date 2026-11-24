# `notifications` (`Notification`)

## Use case

Stores in-app notifications for account events, applications, employer
verification, job moderation, and platform notices.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary notification identifier. |
| `userId` | `String` (UUID) | User who receives the notification. |
| `type` | `NotificationType` | Notification category. |
| `title` | `String` | Short notification heading. |
| `body` | `String` | Notification message. |
| `resourceType` | `String?` | Optional type/name of the related resource. |
| `resourceId` | `String?` (UUID) | Optional identifier of the related resource. |
| `data` | `Json?` | Optional structured event data for rendering or navigation. |
| `readAt` | `DateTime?` | Time the user read the notification; null means unread. |
| `createdAt` | `DateTime` (default now) | Notification creation time. |

## Relations

- Belongs to one `User`; deleting the user cascades to their notifications.
- `resourceType` and `resourceId` are polymorphic metadata, not Prisma
  foreign-key relations.

## Constraints and indexes

- Index on `(userId, readAt, createdAt)` supports unread and chronological
  notification lists.
- Index on `(resourceType, resourceId)` supports lookup by related resource.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
