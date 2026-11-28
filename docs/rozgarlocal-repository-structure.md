# RozgarLocal — Repository Structure & Architecture Guide

**Repository:** `amandeep90s/rozgar-local-app`  
**Status:** Proposed structure for MVP implementation  
**Architecture:** Turborepo monorepo · Modular monolith · Next.js + NestJS · Prisma + PostgreSQL

> This document is based on the repository's current root layout and README. Preserve the existing conventions (`pnpm`, `apps/`, `packages/`, `docs/`, `packages/db`, shared contracts) and expand them incrementally. This is a target structure—not a claim that every folder or feature already exists.

---

## 1. Architecture principles

1. **Modular monolith first:** one NestJS API deployable, separated into domain modules. Do not create microservices for the MVP.
2. **Feature ownership:** place code by business capability (Auth, Jobs, Applications, Employers) instead of organizing the whole API by generic controllers/services folders.
3. **Dependency direction:** business/domain code should not depend on transport (HTTP), UI, or infrastructure implementations.
4. **Shared contracts, not shared internals:** share DTO validation schemas, API types, UI primitives and config. Do not share Nest services or Prisma models directly with the browser.
5. **Database is owned by `packages/db`:** schema, migrations, Prisma client setup and seed scripts live there.
6. **Secure by default:** authorization belongs in the API; frontend route guards are UX, not security.
7. **Mobile-first and localized:** Next.js UI supports Punjabi, Hindi and English; translations remain in message resources.
8. **Make the repo easy to navigate:** every package/app has a README describing its purpose, scripts, exports and dependencies.

---

## 2. High-level repository map

```text
rozgar-local-app/
├── apps/
│   ├── web/                         # Next.js web app / PWA
│   └── api/                         # NestJS REST API
│
├── packages/
│   ├── contracts/                   # API contracts and shared Zod schemas
│   ├── db/                          # Prisma schema, migrations, client and seed
│   ├── ui/                          # Shared UI primitives (only if truly shared)
│   ├── config/                       # Shared TS, ESLint, Prettier configs
│   └── utils/                         # Framework-agnostic utilities (keep small)
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── product/
│   ├── database/
│   ├── development/
│   └── security/
│
├── tooling/                          # Repository scripts and developer tooling
├── .github/
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
├── .husky/
├── .env.example
├── .gitignore
├── .npmrc
├── AGENTS.md
├── SECURITY.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

### Package guidance

- **`contracts`**: canonical request/response schemas, enums exposed to clients, pagination types and API error contracts. Prefer Zod schemas as the source of truth; infer TS types from them.
- **`db`**: Prisma models and database access. Only the API (and migration/seed scripts) should access this package in runtime.
- **`ui`**: shared visual components if needed by more than one app. Keep application-specific components in `apps/web`.
- **`config`**: shared linting, TypeScript and formatting configuration.
- **`utils`**: pure helpers only; avoid turning it into a miscellaneous dumping ground.

Avoid adding a package for every small helper. Introduce packages when there is a clear owner, API, and reuse case.

---

## 3. Next.js app (`apps/web`)

Use the App Router. Keep routes thin and move domain-specific UI/data orchestration into feature folders.

```text
apps/web/
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.webmanifest
├── messages/                          # Existing localization resources
│   ├── en.json
│   ├── pa.json
│   └── hi.json
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx           # Landing/home
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── page.tsx        # Search/list
│   │   │   │   │   └── [jobId]/page.tsx
│   │   │   │   └── employers/[slug]/page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── verify-email/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── (seeker)/
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── saved-jobs/page.tsx
│   │   │   │   └── applications/page.tsx
│   │   │   ├── (employer)/
│   │   │   │   ├── employer/page.tsx
│   │   │   │   ├── employer/jobs/
│   │   │   │   ├── employer/jobs/new/page.tsx
│   │   │   │   └── employer/applications/
│   │   │   └── (admin)/
│   │   │       └── admin/              # Admin UI routes
│   │   ├── api/                       # Next route handlers only when needed
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── features/
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── job-search/
│   │   ├── seeker-profile/
│   │   ├── employer-profile/
│   │   ├── applications/
│   │   ├── saved-jobs/
│   │   ├── notifications/
│   │   └── admin/
│   ├── components/
│   │   ├── layout/                    # Header, footer, nav, locale switcher
│   │   ├── shared/                    # App-level shared components
│   │   └── providers/                 # Query, auth, theme providers
│   ├── lib/
│   │   ├── api-client/                 # Typed API client / fetch wrapper
│   │   ├── auth/                       # Frontend auth helpers only
│   │   ├── env.ts                      # Validated web environment
│   │   ├── i18n/
│   │   └── utils/
│   ├── hooks/                          # Cross-feature hooks only
│   ├── stores/                         # Zustand stores (UI state only)
│   ├── styles/
│   └── middleware.ts                   # Locale routing / UX auth redirects
├── tests/
│   ├── unit/
│   └── e2e/
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Frontend feature folder convention

```text
features/jobs/
├── components/
│   ├── job-card.tsx
│   ├── job-form.tsx
│   └── job-status-badge.tsx
├── hooks/
│   ├── use-jobs.ts
│   └── use-job.ts
├── api/
│   └── jobs.api.ts
├── schemas/                             # UI-only form schemas if not in contracts
├── types.ts
└── index.ts                             # Explicit public exports
```

**Rules**

- Route files should compose layouts and feature components; avoid business logic in `page.tsx`.
- Use TanStack Query for server state/cache and Zustand for transient client/UI state.
- Keep API fetches behind a typed API client; do not scatter raw fetch calls across components.
- Use React Server Components by default; add `"use client"` only for interactive components.
- Avoid importing Prisma or NestJS code into the web app.
- Never treat frontend authorization checks as a security boundary.
- Keep user-generated job descriptions separate from UI translations.

---

## 4. NestJS API (`apps/api`)

Organize the backend by domain modules. Each module owns its routes, application logic, domain rules and data access coordination.

```text
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts               # Optional root / status route
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── middleware/
│   │   ├── policies/                   # Shared policy helpers
│   │   ├── dto/                         # Generic pagination DTO only
│   │   └── constants/
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── validation.ts
│   │   └── config.module.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── prisma.module.ts          # Exposes Prisma service
│   │   ├── mail/
│   │   │   ├── mail.module.ts
│   │   │   └── templates/
│   │   ├── storage/
│   │   ├── logger/
│   │   └── health/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── seeker-profiles/
│   │   ├── employer-profiles/
│   │   ├── employer-verification/
│   │   ├── locations/
│   │   ├── categories/
│   │   ├── skills/
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── saved-jobs/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── moderation/
│   │   └── admin/
│   └── shared/                           # API-local shared code, sparingly
├── test/
│   ├── app.e2e-spec.ts
│   ├── fixtures/
│   └── helpers/
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### NestJS module internals

Start with a practical module shape; only add domain/use-case layers when a module grows or its rules become complex.

```text
modules/jobs/
├── jobs.module.ts
├── jobs.controller.ts                    # HTTP endpoints and mapping
├── jobs.service.ts                       # Application use-cases
├── jobs.repository.ts                     # Data access abstraction (optional)
├── policies/
│   └── job-access.policy.ts
├── dto/
│   ├── create-job.dto.ts
│   ├── update-job.dto.ts
│   ├── search-jobs.dto.ts
│   └── job-response.dto.ts
├── mappers/
│   └── job.mapper.ts
├── domain/
│   ├── job-status.ts
│   └── job-transition.policy.ts
└── jobs.controller.spec.ts
```

For larger domains, split by use case:

```text
modules/applications/
├── applications.module.ts
├── controllers/
│   ├── seeker-applications.controller.ts
│   └── employer-applications.controller.ts
├── use-cases/
│   ├── apply-to-job.use-case.ts
│   ├── withdraw-application.use-case.ts
│   ├── list-applicants.use-case.ts
│   └── change-application-status.use-case.ts
├── domain/
│   ├── application-status.ts
│   └── application-transition.policy.ts
├── repositories/
│   └── applications.repository.ts
├── dto/
├── mappers/
└── tests/
```

### Backend responsibilities

| Module                                        | Responsibilities                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `auth`                                        | Registration, login, Google OAuth, email verification, reset password, refresh rotation, logout/session revocation |
| `users`                                       | Account data, account status, linked identities, account settings                                                  |
| `seeker-profiles`                             | Job seeker profile, experience, skill associations, preferences                                                    |
| `employer-profiles`                           | Employer/business profile, authorized owner access                                                                 |
| `employer-verification`                       | Document submissions, review status, verification level, reviewer decisions                                        |
| `locations`                                   | State/district/city/locality reference data and search                                                             |
| `categories` / `skills`                       | Taxonomy and reference data                                                                                        |
| `jobs`                                        | Job CRUD, publication workflow, expiry, search/filtering                                                           |
| `applications`                                | Apply, withdraw, employer review, status transitions and history                                                   |
| `saved-jobs`                                  | Save/unsave and list                                                                                               |
| `notifications`                               | In-app notification records, delivery orchestration                                                                |
| `reports`                                     | User/job/employer reports and case records                                                                         |
| `moderation`                                  | Review queues, moderation actions and reason codes                                                                 |
| `admin`                                       | Administrative endpoints, role/permission checks, dashboard summaries                                              |
| `audit` (can be shared infrastructure/module) | Append-only records of sensitive/administrative actions                                                            |

### NestJS implementation rules

- Controllers handle HTTP concerns: route, request parsing, response status and mapping.
- Services/use-cases implement application operations and orchestrate transactions.
- Repositories encapsulate persistence when useful; avoid an abstraction layer that simply forwards every Prisma call.
- Domain policies define permitted state transitions and access rules.
- Use guards for authentication and coarse permissions; enforce resource ownership inside the use-case/service/policy.
- Use DTO/schema validation at the API boundary. Keep response shapes explicit—do not expose Prisma records directly.
- Add `@nestjs/swagger` decorators and document endpoint behavior, errors, auth and pagination.
- Use transaction boundaries for multi-step operations (e.g., application + status history + notification event).
- For emails and notifications, use an outbox/queue pattern when introducing asynchronous delivery; do not block critical requests on external providers.
- Keep `common/` generic. Feature-specific guards/policies belong with their module.

---

## 5. Shared packages

### `packages/contracts`

```text
packages/contracts/
├── src/
│   ├── index.ts
│   ├── common/
│   │   ├── pagination.schema.ts
│   │   ├── api-error.schema.ts
│   │   └── result.schema.ts
│   ├── auth/
│   ├── jobs/
│   ├── applications/
│   ├── employers/
│   ├── profiles/
│   ├── notifications/
│   └── locations/
├── package.json
└── tsconfig.json
```

Example schema:

```ts
import { z } from "zod";

export const SearchJobsSchema = z.object({
  q: z.string().trim().optional(),
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchJobsInput = z.infer<typeof SearchJobsSchema>;
```

Share these contracts with the web app and API where compatible. Nest-specific DTOs may adapt/infer from the schema; do not couple this package to NestJS.

### `packages/db`

```text
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── index.ts
│       └── reference-data/
├── src/
│   ├── index.ts
│   ├── prisma-client.ts
│   └── extensions/                     # Add only when justified
├── scripts/
├── package.json
└── tsconfig.json
```

- The API should consume a single configured Prisma client from this package.
- Keep migration history committed.
- Separate development seed data from production reference data if necessary.
- Use explicit migration review; never edit a migration already deployed to shared/production environments.
- Avoid exporting Prisma model types as public API contracts.

### `packages/ui` (optional)

```text
packages/ui/
├── src/
│   ├── components/
│   ├── primitives/
│   └── index.ts
└── package.json
```

Keep Next.js-specific components in the web app. Promote components here only when sharing is beneficial.

---

## 6. Database / Prisma ownership

Database work should be centralized:

```text
packages/db/prisma/
├── schema.prisma
├── migrations/
│   └── YYYYMMDDHHMMSS_description/
│       └── migration.sql
└── seed/
```

Feature areas map to model groups—not separate databases or schemas at MVP stage:

- Identity: `User`, `UserAuthProvider`, `PasswordCredential`, verification/reset tokens, sessions and refresh tokens
- Profiles: seeker and employer profile models
- Employer trust: verification submissions/documents/review metadata
- Marketplace: `Job`, `JobCategory`, `Skill`, `JobSkill`, `Location`
- Applications: `JobApplication`, status history
- Engagement: saved jobs, notifications
- Safety/admin: reports, audit logs

Database migrations are generated and applied from the DB package scripts. API modules should not run migrations at application startup.

---

## 7. API conventions

Recommended REST prefix: `/api/v1`

```text
/api/v1/auth/*
/api/v1/users/*
/api/v1/seeker-profile/*
/api/v1/employers/*
/api/v1/employer-verification/*
/api/v1/jobs/*
/api/v1/applications/*
/api/v1/saved-jobs/*
/api/v1/notifications/*
/api/v1/reports/*
/api/v1/admin/*
```

Guidelines:

- Use resource-oriented routes, predictable HTTP verbs and status codes.
- Paginate collection endpoints; define a consistent response format.
- Validate filters and sort options with allowlists.
- Avoid exposing internal IDs or sensitive fields unnecessarily.
- Use request IDs and structured logs for tracing.
- Document auth requirements, ownership rules, validation and error responses in Swagger.
- Version the API when introducing incompatible contract changes—not for every small update.

Example response envelope (use consistently if adopting it):

```json
{
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

For paginated lists:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0,
    "requestId": "..."
  }
}
```

---

## 8. Testing layout and strategy

### Web

- Unit/component tests for interactive components and feature logic.
- Playwright end-to-end tests for critical user flows.
- Keep E2E tests grouped by journey (auth, job search, application, employer workflow, admin moderation).

### API

- Unit tests for services/use-cases and domain policies.
- Integration tests for repositories and database-dependent operations.
- E2E tests for HTTP routes, guards, validation, auth, ownership and status transitions.
- Use isolated test database/schema or test containers; avoid shared development DB.

Suggested locations:

```text
apps/web/tests/
├── unit/
└── e2e/
    ├── auth/
    ├── job-search/
    ├── applications/
    └── employer/

apps/api/test/
├── e2e/
├── fixtures/
└── helpers/

apps/api/src/modules/**/
└── *.spec.ts
```

Test minimum critical flows:

1. Register, verify email, sign in, refresh, logout.
2. Password reset invalidates/revokes applicable sessions.
3. Google sign-in and safe identity linking.
4. Seeker can apply; duplicate application blocked.
5. Employer can only access applicants for owned jobs.
6. Job publication and application status transitions are enforced.
7. Admin permissions, verification and moderation actions are audited.
8. Public search returns only eligible published jobs.

---

## 9. Environment, configuration and secrets

Keep environment variables validated at app startup. Do not use arbitrary `process.env` throughout business code.

Root `.env.example` should document local variables only (never real secrets). Suggested groups:

```dotenv
# Database
DATABASE_URL=

# API
PORT=3001
API_PREFIX=api/v1
WEB_ORIGIN=http://localhost:3000

# Auth
JWT_ACCESS_SECRET=
JWT_ACCESS_TTL=
REFRESH_TOKEN_TTL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
MAIL_PROVIDER=
MAIL_FROM=
MAIL_API_KEY=

# Storage (when employer documents/profile images are introduced)
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

Use local `.env`/`.env.local` files ignored by Git and production secret management. Document which app reads each variable.

---

## 10. CI and developer workflow

The repository currently uses pnpm + Turborepo and has lint, type-check, test, API E2E, build and web Playwright scripts. Keep these checks in CI.

Recommended PR pipeline:

1. Install using frozen lockfile.
2. Build shared contracts (and DB client if needed).
3. Lint.
4. Type-check.
5. Unit tests.
6. API E2E tests using a disposable test database if required.
7. Build both applications.
8. Run web E2E on critical paths (can be a separate job).
9. Dependency/security scanning and secret scanning.

Keep package scripts consistent (`lint`, `check-types`, `test`, `build`) wherever practical. CI should run affected workspace tasks using Turborepo caching, but ensure required upstream packages are built first.

---

## 11. Documentation layout

```text
docs/
├── product/
│   └── RozgarLocal-PRD-Revised.md
├── architecture/
│   ├── repository-structure.md         # This document
│   ├── architecture-overview.md
│   ├── auth-and-session-design.md
│   └── decisions/
│       ├── 0001-modular-monolith.md
│       └── 0002-shared-contracts.md
├── api/
│   └── api-guidelines.md
├── database/
│   ├── schema-overview.md
│   └── tables/
├── security/
│   ├── security-baseline.md
│   └── threat-model.md
└── development/
    ├── local-setup.md
    ├── testing.md
    └── contribution-guide.md
```

Use Architecture Decision Records (ADRs) for decisions that may be revisited. Keep them short: context, decision, alternatives, consequences.

---

## 12. Naming and code conventions

- Use kebab-case for filenames: `create-job.dto.ts`, `job-transition.policy.ts`.
- Use PascalCase for classes/types: `JobsService`, `CreateJobDto`.
- Use camelCase for variables/functions: `searchJobs`, `jobId`.
- Prefer explicit named exports; avoid deep wildcard barrel exports that hide dependencies.
- Avoid `index.ts` files that re-export an entire module and cause circular dependencies. Use only deliberate public entrypoints.
- Do not create `base.service.ts`, generic CRUD abstractions, or repositories for every table without a clear use case.
- Keep modules small enough to be understandable; split when responsibilities or testing needs diverge.
- Avoid `any`; use `unknown` and narrow it.
- No secrets, production data, private documents or credentials in fixtures.

---

## 13. Suggested build order

Implement in vertical slices so each stage can be run, tested and reviewed:

### Phase 0 — Foundation

- Confirm workspace scripts and package boundaries.
- Add validated environment configuration.
- Establish API global prefix, validation, exception format, Swagger, logging and health/readiness checks.
- Establish DB package and migration workflow.
- Add CI baseline.

### Phase 1 — Authentication

- User account model and provider identity linking.
- Email/password registration/login, email verification.
- Google OAuth.
- Refresh token rotation, sessions, logout.
- Forgot/reset password and rate limiting.
- Auth integration tests.

### Phase 2 — Profiles and reference data

- Seeker profile.
- Employer profile.
- Locations, categories, skills.
- Profile editing and authorization.

### Phase 3 — Jobs

- Job draft/create/edit.
- Employer verification/publishing policy.
- Public search/detail and filters.
- Lifecycle and expiry handling.

### Phase 4 — Applications

- Apply/withdraw.
- Employer applicant list.
- Status updates/history.
- Notifications.

### Phase 5 — Safety/admin

- Employer verification review.
- Job/user reports.
- Moderation queue.
- Audit trail and admin access controls.

### Phase 6 — Production readiness

- Observability and alerts.
- Backup/restore rehearsal.
- Security review.
- Performance checks.
- PWA behavior and localization QA.
- Deployment and rollback procedure.

---

## 14. What should be implemented now vs later

**Create now**

- `apps/api/src/modules` with the first `auth` module.
- `apps/api/src/common` and `config`.
- `apps/api/src/infrastructure/database`.
- `packages/contracts` (continue existing shared-contracts package if this is its current name; avoid renaming without need).
- `packages/db` (preserve current package name and scripts).
- `docs/architecture/repository-structure.md`.
- Module READMEs only for complex/important packages.

**Do not build yet**

- Microservices or event bus infrastructure.
- A generic repository framework.
- Multiple backend deployments.
- Redis unless a concrete caching/queue/session requirement is ready.
- Separate packages for every feature.
- Complex CQRS/event sourcing.
- AI matching, chat or payment systems in the MVP.

---

## 15. Acceptance checklist for this structure

- [ ] Each app/package has a clear owner and purpose.
- [ ] Web does not import Prisma or backend internals.
- [ ] API modules own business rules and authorization.
- [ ] Shared contracts contain stable public schemas/types only.
- [ ] Database schema/migrations are managed from `packages/db`.
- [ ] All environment variables are validated.
- [ ] Authentication tokens/secrets never enter logs.
- [ ] Critical domain transitions have tests.
- [ ] API is documented through OpenAPI/Swagger.
- [ ] CI runs lint, type-check, tests and builds.
- [ ] Feature code is grouped by domain, not generic technical folders.
- [ ] No unnecessary microservices or abstraction layers.

---

## 16. Repository reference

Repository: https://github.com/amandeep90s/rozgar-local-app

At the time this guide was drafted, the repository README describes a starter monorepo with `apps`, `docs`, and `packages`, pnpm/Turborepo, Next.js, NestJS, shared contracts, and a Prisma package under `packages/db`. Consult the live repository before making structural changes; this guide intentionally recommends extending its current setup rather than rebuilding it from scratch.
