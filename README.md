# Elixir Project Estimator

A web version of Elixir Solutions' project estimation workbook (Business
Assessment through HubSpot Deployment & Go-Live, plus ElixirSync and Third
Party integrations), with a shared dashboard so estimations live in one
place instead of scattered spreadsheet copies.

- **Estimator** (`/estimations/[id]`) &mdash; edit standard effort, complexity
  factors, and per-line items for every workstream, live totals, PM % and
  integration subscriptions.
- **Dashboard** (`/`) &mdash; every saved estimation with client, status,
  hours, price, and last edit. "Duplicate" freezes a copy as a snapshot you
  can pull numbers from for a proposal while the original stays editable.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind, Prisma 7 + PostgreSQL.
No authentication (open-link, by request &mdash; see **Security note** below).

## Differences from the source spreadsheet

The original `.xlsx` had a few real bugs, fixed here rather than replicated:

1. **Setup-row complexity lookups were off by one** in the Sales, CMS,
   DealHub, and HS Deployment & Go-Live tabs (a copy-paste error meant each
   Setup line used the complexity dropdown of the row *above* it). Every
   line here always uses its own dropdown.
2. **Truncated complexity ranges** in Marketing and CMS meant the "Medium"
   and "High" session-complexity options couldn't actually be looked up in
   Excel (the VLOOKUP range didn't reach that far after rows were inserted).
   Fixed by giving every workstream its complete 4-level table.
3. **Overview total-price formula bug**: the spreadsheet's Third Party
   Integration price multiplied the *ElixirSync* workstream's hours by the
   Third Party rate. Fixed so each row multiplies its own hours.

If you need numbers that reconcile with an old Excel estimate line-for-line,
they may be off by these amounts for the affected tabs.

## Local development

Requires Node 20+ and a Postgres database.

```bash
npm install
cp .env.example .env   # if starting fresh; otherwise edit .env directly
# set DATABASE_URL to a local Postgres, e.g.:
# postgresql://user:password@localhost:5432/estimator?schema=public

npm run db:migrate     # creates the Estimation table
npm run dev            # http://localhost:3000
```

`npm run verify-totals` runs the calculation engine against the default
template and prints per-workstream totals &mdash; useful as a quick regression
check after changing `src/lib/calculations.ts` or `src/lib/templates.ts`.

## Deploying to Vercel

1. **Push this repo to GitHub** (already done if you're reading this from
   the repo) and import it into a new Vercel project.
2. **Create a Postgres database** from the Vercel project's **Storage** tab
   &mdash; either "Vercel Postgres" (Neon-backed) or connect an existing Neon
   / Supabase database. Vercel adds a `DATABASE_URL` environment variable
   automatically when you create it there; if you're connecting your own,
   add `DATABASE_URL` yourself under **Settings &rarr; Environment Variables**
   (use the *pooled* connection string, not the direct one, since serverless
   functions open many short-lived connections).
3. **Deploy.** The build script (`npm run build`) runs
   `prisma generate && prisma migrate deploy && next build`, so the
   database schema is created/updated automatically on every deploy as long
   as `DATABASE_URL` is set. No manual migration step needed.
4. Open the deployed URL and share it with the team.

### Redeploying after schema changes

Edit `prisma/schema.prisma`, run `npx prisma migrate dev --name <change>`
locally to generate the migration file, commit it, and push &mdash; the next
Vercel build applies it automatically via `prisma migrate deploy`.

## Security note

Per your request this app has **no authentication** &mdash; anyone with the
URL can view and edit every estimation, including hourly rates and pricing.
That's fine for an internal link shared only with the team, but:

- Don't post the URL anywhere public (a public Slack channel, a doc that
  gets shared externally, etc.).
- If this later needs to be restricted, the cleanest option is Google SSO
  restricted to `@elixir-solutions.nl` (e.g. via
  [NextAuth](https://authjs.dev) with the Google provider and a
  domain check in the `signIn` callback) &mdash; happy to wire that up if
  priorities change.

## Known dev-dependency advisories

`npm audit` reports high-severity advisories in `mysql2` and
`deepmerge-ts`. Both are transitive dependencies of the `prisma` CLI
package (used only for `prisma generate` / `migrate` during development
and build), not of `@prisma/client` which is what actually ships in the
deployed app. They're not part of the runtime bundle.

## Project structure

```
src/
  app/
    page.tsx                    Dashboard
    estimations/[id]/page.tsx   Estimator (server component, loads the record)
    api/estimations/...         REST API (list/create/read/update/delete/duplicate)
  components/
    editor/                     Estimator UI (tabs, panels, summary sidebar)
    ...                         Dashboard UI (search, row actions, new-estimation dialog)
  lib/
    types.ts                    Shared TypeScript types for an estimation's state
    templates.ts                Default line items, extracted from the source .xlsx
    calculations.ts             All total/price math (the "formula engine")
    validation.ts                Zod schemas for the API boundary
    prisma.ts                   Prisma client (pg driver adapter)
prisma/
  schema.prisma                 Estimation model (JSON payload + cached totals)
scripts/
  verify-totals.ts              Regression check against the default template
```
