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
the browser reuses one client. Clear user-specific cached data on logout or
account changes when such data is added.

Use the `@/` alias for imports from the web app root.

The email/password forms call the API through server actions. Google sign-in
remains unavailable. See the repository README for the required API, proxy,
session and Resend configuration and current security limitations.
The form validation schemas live in `@repo/contracts` and use translation keys
for their error messages; they describe form input, not API request payloads.

Registration offers one account role: job seeker (the default) or employer.
The selected role is sent to the registration API and cannot be changed by
registering an existing email again.

Employer and job seeker profiles share state/city `FormSelect` controls.
`country-state-city` runs only on the server; React Query caches Indian
state options and cities by state without shipping the worldwide dataset
to the browser or requesting third-party location services. Changing a
state clears its city. If a saved profile already has a city, changing state
requires a replacement city before saving to avoid retaining the old city
on partial API updates. New profiles may still save state-only drafts.
Legacy saved names are preserved with a notice when not
in the catalogue. Locations are not seeded into the database.
The package is added to the dependency manifest only; installation and
full runtime validation remain pending. Review its GPL-3.0 license for
the intended distribution before launch.

Reusable React Hook Form controls are in `components/form/`: text inputs,
textareas, OTP inputs, checkboxes and checkbox groups, switches, radio groups,
selects, comboboxes, and single-value sliders. Use `FormSelect` from
`@/components/form/form-select` for dropdowns in React Hook Form forms instead
of native selects. Pass `control`,
`name`, and `label`, and provide matching `defaultValues` to `useForm` (strings,
booleans, string arrays, or numbers as appropriate). Choice controls use
`{ value, label, disabled? }` options and store string values; an empty string
represents no selection. `formatError` can translate validation messages.
`FormSelect` accepts `onValueChange` for dependent fields. Its `readOnly`
option blocks selection while retaining the value in React Hook Form;
`disabled` follows React Hook Form's behavior of omitting disabled fields.
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
