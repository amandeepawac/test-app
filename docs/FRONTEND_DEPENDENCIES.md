# Frontend dependencies

The web app already declares the following core frontend packages in
`apps/web/package.json`:

- `next`
- `react`
- `react-dom`
- `next-intl`
- `@tanstack/react-query`
- `zod`
- `zustand`
- `tailwindcss`
- `shadcn`

## Additional requested package

| Package | Suggested version | Status |
| --- | --- | --- |
| `react-hook-form` | `^7.92.0` | Not yet added to `apps/web/package.json` |

The package manager was not used to install or update dependencies. Add the
requested package to the web app manifest and update the workspace lockfile
when dependency installation is available.
