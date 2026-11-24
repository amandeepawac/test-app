# `seeker_skills` (`SeekerSkill`)

## Use case

Join table associating a job-seeker profile with a skill, with optional
experience and proficiency context for that specific seeker-skill pair.

## Scalar fields

| Field | Prisma type | Purpose |
| --- | --- | --- |
| `id` | `String` (UUID, generated) | Primary association identifier. |
| `seekerProfileId` | `String` (UUID) | Associated seeker profile. |
| `skillId` | `String` (UUID) | Associated catalog skill. |
| `experienceYears` | `Decimal?` (4,1) | Optional years of experience with this skill. |
| `proficiencyNote` | `String?` | Optional free-form skill context. |
| `createdAt` | `DateTime` (default now) | Association creation time. |

## Relations

- Belongs to one `SeekerProfile` and one `Skill`.
- Deleting either related profile or skill cascades to this association.

## Constraints and indexes

- `(seekerProfileId, skillId)` is unique, preventing duplicate skill entries
  for one seeker.
- Index on `skillId` supports finding seekers by skill.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
