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

The home page previews the planned job seeker and employer journeys. Job
search is disabled until job discovery is implemented; it does not display
sample listings or submit search requests.

TanStack Query is available to Client Components through the root query
provider. It uses the library defaults; choose query keys, freshness, and
retry policies for each feature. Server renders use isolated clients, while
the browser reuses one client. When authentication is implemented, clear
user-specific cached data on logout or account changes.

Use the `@/` alias for imports from the web app root.

The registration form calls the API and sends an email verification link.
Sign-in, forgot-password, and reset-password remain UI previews; Google sign-in
and sessions are not available yet. See the repository README for the required
API and Resend configuration and current security limitations.
The form validation schemas live in `@repo/contracts` and use translation keys
for their error messages; they describe form input, not API request payloads.

Reusable React Hook Form controls are in `components/form/`: text inputs,
textareas, OTP inputs, checkboxes and checkbox groups, switches, radio groups,
selects, native selects, comboboxes, and single-value sliders. Pass `control`,
`name`, and `label`, and provide matching `defaultValues` to `useForm` (strings,
booleans, string arrays, or numbers as appropriate). Choice controls use
`{ value, label, disabled? }` options and store string values; an empty string
represents no selection. `formatError` can translate validation messages.
For other controls, compose `FormField` with the shadcn primitive and forward
the controller's value, change, blur, ref, and accessibility properties.

```tsx
const form = useForm({ defaultValues: { email: '', alerts: false } });

<FormInput control={form.control} name="email" label="Email" type="email" />;
<FormCheckbox control={form.control} name="alerts" label="Receive alerts" />;
```

Import `FormInput` from `@/components/form/form-input` and `FormCheckbox` from
`@/components/form/form-checkbox`. Numeric or date inputs using `FormInput`
store strings; use an appropriate schema to parse them if needed.
