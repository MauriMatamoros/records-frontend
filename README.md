# Records web app

Web app for **Records**, PartnerHero's internal replacement for Airtable. It talks to the [records-backend](https://github.com/MauriMatamoros/records-backend) API. Deployment (Docker Compose + Caddy) lives in that repo's `deploy/` folder.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Chakra UI 3 · SWR · React Context · TypeScript 6 · Node 24 LTS · pnpm 12.

## What's in it

- **Tables** (`/tables`): searchable, paginated list. New tables can start blank or be created from a CSV or Excel file, with column types detected and a preview before anything is created.
- **Table grid** (`/tables/[id]`):
  - Click-to-edit cells for every column type, with optimistic updates that roll back with an explanation when the API rejects a change (for example a duplicate primary key).
  - Column menus to sort, filter, move, edit and delete columns.
  - A filter builder with type-aware operators and match all / any.
  - Search and pagination. The whole view lives in the URL, so a filtered view can be shared as a link.
- **Import / export:**
  - Import shows a dry-run report (adds, updates, row-level errors, ignored headers) before committing, and supports append or upsert by primary key.
  - Export downloads exactly the current view as `.xlsx` or `.csv`.
- **API panel:** a ready-to-copy `curl` for the current view, for teams wiring up a service.
- **People** (`/users`): invite company emails and remove access.
- **API tokens** (`/tokens`): create tokens (shown once) and revoke them.
- **Activity log** (`/logs`): every change, sign-in, import, export and API read, filterable by type, person/token and date.

### Design

The grid is styled as ledger paper: green rule lines, a line-number margin with a double margin rule, and the primary-key column pinned. Everything else stays quiet. Colors are semantic tokens in `src/lib/theme.ts` with light and dark values (toggle in the sidebar). Type is Public Sans, with IBM Plex Mono used only for API keys and tokens.

## Development

Requirements: Node 24 LTS and pnpm 12 (`corepack enable`). Start the API first (see the backend README), then:

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

In development, `next.config.ts` proxies `/api/*` to `BACKEND_URL` (default `http://localhost:4000`), so the browser stays same-origin and the session cookie stays first-party. In production, Caddy routes `/api/*` to the API instead.

Until Google OAuth credentials are configured on the API, use the **Development sign-in** form on the login page with an invited email (the API's `INITIAL_USER_EMAIL` exists by default).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` / `pnpm start` | Production build (standalone output) / serve it |
| `pnpm lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `pnpm exec tsc --noEmit` | Typecheck |

## Structure

```
src/
  app/
    login/                 sign-in page (Google, or dev sign-in locally)
    (app)/                 signed-in area: AuthProvider + AppShell
      tables/ [tableId]/   tables list and the grid view
      users/ tokens/ logs/
  components/
    grid/                  RecordsGrid, cell editors, column/record dialogs, FilterBuilder
    transfer/              import dialog, dry-run report, export menu
    tables/                new-table dialog (blank or from a file)
    ui/                    Chakra provider, toaster
  context/
    AuthContext.tsx        current user via SWR (/api/auth/me), sign-out
    TableContext.tsx       table schema, URL-backed view state, rows, optimistic cell updates
  lib/                     API client, types, theme, column-type metadata, formatting
  proxy.ts                 redirects to /login when there's no session cookie
```

Data fetching uses SWR throughout (`src/components/ui/provider.tsx` sets the global fetcher). Mutations call the API, then revalidate or optimistically update the affected SWR keys.
