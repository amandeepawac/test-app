# RozgarLocal

RozgarLocal is a work-in-progress local employment platform. The repository
contains a Next.js web app, a NestJS API, shared contracts and a Prisma
database package. Email/password registration, verification, sign-in, session
management and password recovery are implemented but require deployment
configuration and end-to-end testing. Marketplace features are not implemented.

## Prerequisites

- Node.js 24 or newer
- pnpm 11.25.0 (the version specified in `package.json`)
- PostgreSQL only when working on database migrations or database features

## Getting started

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The home page checks the API at
`http://127.0.0.1:3001/health`. This is a process liveness check, not a
database readiness check. The API also retains its starter `GET /` route.

The web app supports English, Punjabi, and Hindi using `next-intl`. Selecting a
language from the header menu applies it immediately and stores the choice in
a browser cookie (English is the default); URLs do not change and preferences
are not yet synced to accounts. Without JavaScript, the header offers language
buttons instead.
Translations live in `apps/web/messages`.

The API reads `PORT` from the process environment or the root `.env` file
and defaults to `3001`. For the web app, set `API_BASE_URL` in the process
environment or `apps/web/.env.local` when the API is on another HTTP(S)
origin. The default is `http://127.0.0.1:3001`. The web app calls this
address server-side; it must be reachable from the web server.

The shared contracts and database packages are built before application
development, builds, and checks. The database package generates Prisma Client
as part of its build. Restart `pnpm dev` after changing a shared contract.

Authentication requires a migrated database and `DATABASE_URL`, `WEB_BASE_URL`,
`AUTH_MAIL_FROM`, `RESEND_API_KEY`, `AUTH_JWT_SECRET` and `AUTH_PROXY_SECRET` in
the API environment. Set the same `AUTH_PROXY_SECRET` in the web server
environment (for local development, `apps/web/.env.local`). Each secret must
be independently generated using a cryptographically secure random generator
and contain at least 32 UTF-8 bytes. Never commit secrets. Use HTTPS for the
public web origin and the API connection outside localhost, and a verified
Resend sender.

The web server stores access and rotating refresh tokens in HttpOnly,
SameSite=Lax cookies (Secure in production). It uses Next.js server actions'
origin/host CSRF checks; configure the reverse proxy to overwrite the Host and
forwarded host headers correctly. Session refresh is coordinated across tabs
using Web Locks. Browsers without Web Locks cannot automatically resume an
expired access session and must sign in again.

Production requires exactly one trusted reverse proxy in front of Next.js. It
must overwrite `X-Forwarded-For` with exactly one validated client IP and
remove client-supplied forwarding headers; block direct access to Next.js.
The web server signs the IP with `AUTH_PROXY_SECRET` for the API, which uses
Nest's throttler for global and endpoint-level per-IP limits (`THROTTLE_LIMIT`
and `THROTTLE_TTL` set the global limit), tighter per-route limits, and a
separate hashed account bucket for registration, login and password reset
requests. The throttler's default storage is per-process; configure shared
storage before running multiple API replicas. Keep the API private or ensure its
direct clients' socket IPs are reliable, synchronize server clocks, and add
edge-level abuse protection. Do not share the proxy secret with clients.
Verification, reset and session records need a separately scheduled retention
policy.
Keep consumed refresh tokens until their session expires so replay detection
continues to work.
Protect token-bearing URLs from access logs and analytics. Email delivery is
synchronous and failed deliveries must be retried by the user. Review and test
the complete deployment and authentication flows before exposing them.

The lockfile needs to be refreshed after the dependency changes on a machine
where installation is permitted; frozen installation will fail until then.
When running API commands directly, build `@repo/contracts` and `@repo/db`
first. Turbo's current strict environment configuration does not pass
`WEB_BASE_URL`, `AUTH_MAIL_FROM`, `RESEND_API_KEY`, `AUTH_JWT_SECRET`, or
`AUTH_PROXY_SECRET` from the process
environment; use the root `.env` for development or launch the built API
directly with these environment variables until Turbo is configured for them.

## Checks

```sh
pnpm lint
pnpm check-types
pnpm test
pnpm --filter api test:e2e
pnpm build
pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e
```

The web end-to-end test starts both apps on ports 3000 and 3001. Stop other
services on those ports first; in local runs Playwright can reuse already
running servers. To use an existing local Chromium or Chrome installation
instead of downloading Playwright's browser, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path. CI runs these
checks without a database.

## Database

Copy `.env.example` to `.env` and set `DATABASE_URL` when using PostgreSQL.
Do not commit credentials. Prisma configuration, schema and migrations live
in `packages/db`. Once a PostgreSQL instance is available:

```sh
pnpm db:generate
pnpm db:migrate
```

`db:migrate` is the interactive development migration command. Review the
migrations and use Prisma's `migrate deploy` for deployment. Master-data
seeders in [packages/db/prisma/seeds](packages/db/prisma/seeds) populate job
categories and skills. Locations are not seeded; the frontend will use
`country-state-city-nextjs` later. After dependencies are available,
migrations are applied, and the Prisma client is generated, run from the
repository root:

```sh
npm --prefix packages/db run db:seed
```

Prisma's `db seed` command also uses this seed entry point. Seeders run in
one transaction and may be rerun: existing IDs, inactive flags, descriptions,
and category parent relationships are preserved; seed names and category
sort order are refreshed. No records are deleted and no user accounts,
jobs, applications, or verification documents are created. Confirm
`DATABASE_URL` targets the intended database before running the seed.

The current `db:test` script writes a demo user and should only be used with a
disposable development database.

See the [PRD](docs/RozgarLocal-PRD.md) and
[database reference](docs/database/tables/README.md) for the intended product
and data model.
