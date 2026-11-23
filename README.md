# Affordabiz Site Generator

A public form at `/create` builds a webpage at `/{slug}` from a template. The page is stored in Sanity and the owner gets the link by email through Brevo. Each page's contact form also emails the owner.

Design spec: `docs/superpowers/specs/2026-11-22-affordabiz-site-generator-design.md`
Implementation plan: `docs/superpowers/plans/2026-11-22-affordabiz-site-generator.md`

## Setup

1. `cp .env.example .env.local` and fill in the values (see below).
2. `pnpm install`
3. `pnpm seed` creates the Template 1–7 documents in Sanity. It **overwrites** the template text, so run it once.
4. `pnpm dev`, then open http://localhost:3000. Sanity Studio is at http://localhost:3000/studio.

## Environment

| Var | Where |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public base URL, e.g. `https://pages.affordabiz.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` | sanity.io/manage (datasets `production` and `test`, both public) |
| `SANITY_API_WRITE_TOKEN` | Sanity API token with Editor rights |
| `SANITY_REVALIDATE_SECRET` | Any random string. Set the same value on the Sanity webhook. |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Brevo → SMTP & API. The sender address must be verified. |
| `BREVO_DRY_RUN` | `1` logs emails instead of sending them |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile. The defaults are Cloudflare's always-pass test keys. |

In sanity.io/manage → API → CORS origins, add `http://localhost:3000` (allow credentials) and your production domain.

## Sanity webhook (after deploy)

| Setting | Value |
|---|---|
| URL | `{NEXT_PUBLIC_SITE_URL}/api/revalidate` |
| Dataset | `production` |
| Trigger | create, update, delete |
| Filter | `_type in ["site","template"]` |
| Projection | `{_type, "slug": slug.current}` |
| Secret | the value of `SANITY_REVALIDATE_SECRET` |

## Admin tasks

- **Take a page offline:** Studio → Site → turn off "published".
- **Edit template wording:** Studio → Template N → Fixed text. You can use these tokens: `{{fullName}} {{businessName}} {{email}} {{phone}} {{address}} {{servingArea}}`.
- **Content still to add:** paste the Refund Advantage / Pathward disclaimers and the remaining FAQ answers into Template 1. Empty items stay hidden until you do.
- **Contact messages:** they're logged under "Contact message", including whether the email was sent.

## Adding templates 2–7

1. Build `src/templates/tN/` using the same `TemplateProps`, plus `tN/defaultCopy.ts`.
2. Add a `case` to `TemplateView` in `src/templates/registry.tsx` and add N to `IMPLEMENTED`. Also register the default copy in `src/templates/defaults.ts`.
3. Set `status: "live"` in `src/templates/catalog.ts`.
4. Create the Template N text in Studio, or run `pnpm seed` (which overwrites all template text).

## Scripts

| Command | What it does |
|---|---|
| `pnpm test` | Unit tests (Vitest) |
| `pnpm e2e` | End-to-end test (Playwright). Needs the Sanity `test` dataset. Stop any running `pnpm dev` first. |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm build` | Production build |
