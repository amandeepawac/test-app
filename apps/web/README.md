# RozgarLocal web

See the [repository README](../../README.md) for setup and commands.

## Structure

- `app/` contains Next.js routes, layouts, global styles, and route assets.
  Keep routes focused on composing features.
- `features/` groups application-specific code by capability. `home/` owns
  the home screen and its health check; `language/` owns language selection.
  Add feature folders when the corresponding functionality is implemented.
- `components/ui/` contains reusable UI primitives. `components/layout/`
  contains shared site layout components, and `components/providers/`
  contains application-wide providers.
- `i18n/` configures `next-intl` and supported locales; `messages/` holds
  translations. The language preference is stored in a browser cookie.
- `hooks/` and `lib/` contain shared hooks and utilities. Keep feature-only
  code with its feature instead of placing it in these shared folders.
- `tests/` contains Playwright tests, grouped by the behavior being tested.
  Put future feature-specific tests with their feature or in a matching
  `tests/` folder, and keep cross-feature journeys in `tests/e2e/`.

The web app communicates with the NestJS API; it must not import Prisma or
connect directly to the database. Keep server-only configuration and API
access out of Client Components.

TanStack Query is available to Client Components through the root query
provider. It uses the library defaults; choose query keys, freshness, and
retry policies for each feature. Server renders use isolated clients, while
the browser reuses one client. When authentication is implemented, clear
user-specific cached data on logout or account changes.

Use the `@/` alias for imports from the web app root.
