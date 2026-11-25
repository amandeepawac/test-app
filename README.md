# RozgarLocal

RozgarLocal is a work-in-progress local employment platform. The repository
contains a Next.js web app, a NestJS API, shared contracts and a Prisma
database package. Authentication and marketplace features are not implemented;
the web app includes UI-only authentication previews.

## Prerequisites

- Node.js 24 or newer
- pnpm 11.25.0 (the version specified in `package.json`)
- PostgreSQL only when working on database migrations or database features

## Getting started

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The home page checks the API at
`http://127.0.0.1:3001/health`. This is a process liveness check, not a
database readiness check. The API also retains its starter `GET /` route.

The web app supports English, Punjabi, and Hindi using `next-intl`. The
language selector stores the choice in a browser cookie (English is the
default); URLs do not change and preferences are not yet synced to accounts.
Translations live in `apps/web/messages`.

The API reads `PORT` from the process environment or the root `.env` file
and defaults to `3001`. For the web app, set `API_BASE_URL` in the process
environment or `apps/web/.env.local` when the API is on another HTTP(S)
origin. The default is `http://127.0.0.1:3001`. The web app calls this
address server-side; it must be reachable from the web server.

The shared contracts package is built before application development,
builds, and checks. Restart `pnpm dev` after changing a shared contract.

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
migrations and use Prisma's `migrate deploy` for deployment. No seed data is
provided until reference data and verification policies are agreed. The
current `db:test` script writes a demo user and should only be used with a
disposable development database.

See the [PRD](docs/RozgarLocal-PRD.md) and
[database reference](docs/database/tables/README.md) for the intended product
and data model.
