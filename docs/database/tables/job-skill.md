# `job_skills` (`JobSkill`)

## Use case

Join table connecting a job listing to a skill and indicating whether the
skill is required or preferred.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary association identifier. |
| `jobId` | `String` (UUID) | Associated job listing. |
| `skillId` | `String` (UUID) | Associated catalog skill. |
| `isRequired` | `Boolean` (default `true`) | Whether applicants are expected to have the skill. |
| `createdAt` | `DateTime` (default now) | Association creation time. |

## Relations

- Belongs to one `Job` and one `Skill`.
- Deleting either the job or skill cascades to this association.

## Constraints and indexes

- `(jobId, skillId)` is unique, preventing duplicate skills on one job.
- Index on `skillId` supports finding jobs that request a skill.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
