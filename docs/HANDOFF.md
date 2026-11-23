# Affordabiz Site Generator — Agent Handoff (2026-11-23)

You are continuing work on an existing project. Read this fully before doing anything.

## Hard rules
- **Keep this project fully separate from Figmenta.** Never use the `figmenta-dev` Vercel team, Figmenta GitHub orgs/accounts, or Figmenta Notion/MakingFlow/Figma workspaces. If only Figmenta options exist, stop and ask.
- Use **pnpm** (v11), not npm. `pnpm-workspace.yaml` allows esbuild builds. Keep that setting.
- Never commit secrets. `.env.local` and `.env.vercel` hold real keys and are git-ignored. Don't print secret values in chat.
- Don't write test data to the Sanity `production` dataset, and don't merge to `main` or deploy, without the user's explicit OK.

## What the product does
A public onboarding form at `/create` collects:
- name, business name, email, phone, address, serving area
- a web address (slug), with a live availability check
- a template choice (1–7), each with a preview that opens in a new tab
- a logo and a personal photo

On submit, the server:
1. validates the input,
2. uploads the images and creates a `site-{slug}` document in Sanity,
3. publishes the page at `/{slug}` from the chosen template filled with the user's data,
4. emails the owner the link through Brevo.

Each generated page has a contact form that emails the owner through Brevo, with reply-to set to the visitor. Template 1 is built: a redesign of taxprep.me/template-1 that keeps the teal/orange theme and the paragraphs verbatim. Templates 2–7 are registered as "coming soon" until the user supplies reference designs. A general form builder is planned for later. The field config in `src/forms/onboarding.fields.ts` is the seam for it.

## Stack
- Next.js 16.4 (App Router, `cacheComponents`, React Compiler, Turbopack), React 19.3.1, TypeScript, Tailwind v4
- Sanity (`next-sanity`, Studio embedded at `/studio`), project ID `l9ureybe`, dataset `production`
- Brevo transactional API (`src/lib/brevo.ts`). `BREVO_DRY_RUN=1|true` logs emails instead of sending them.
- Cloudflare Turnstile (`@marsidev/react-turnstile` on the client, `src/lib/turnstile.ts` on the server)
- zod v4, lucide-react 1.x (some names changed: `LoaderCircle`, `CircleCheck`, `CircleX`, `TriangleExclamationPoint`)
- Vitest (81 unit tests), Playwright e2e in `e2e/`

## Docs to read first
- Spec: `docs/superpowers/specs/2026-11-22-affordabiz-site-generator-design.md`
- Plan (15 tasks, all implemented): `docs/superpowers/plans/2026-11-22-affordabiz-site-generator.md`
- `README.md` covers setup, env vars, admin tasks and how to add templates 2–7.

## Key code map
- `src/app/create/`: `OnboardingForm.tsx`, `useSlugAvailability.ts` (debounced check plus check on blur), `ImageInput.tsx`
- `src/app/[slug]/page.tsx`: the generated site
- `src/app/templates/[n]/preview/page.tsx`: preview with sample data
- `src/app/api/`:
  - `sites` (create a site)
  - `slug-available` (check a slug)
  - `contact/[slug]` (contact form)
  - `revalidate` (Sanity webhook)
- `src/lib/sanity/`: `queries.ts` (`"use cache"` + `cacheTag`), `write.ts` (server-only writes)
- `src/templates/`:
  - `catalog.ts` (template status, names, swatches)
  - `registry.tsx` (`TemplateView` switch, which the React Compiler lint requires)
  - `defaults.ts`
  - `t1/` (Template 1 sections plus verbatim `defaultCopy.ts`)
- `src/sanity/schemaTypes/`: `site`, `template` (editable fixed copy with `{{tokens}}`), `contactMessage`, `linkItem`
- `scripts/seed-templates.ts` (`pnpm seed`) overwrites the template-1..7 docs. Already run once; don't re-run casually.

Next 16 gotchas used in the code:
- `revalidateTag(tag, { expire: 0 })` always takes a second argument.
- Always `await params`.
- No `export const dynamic`.
- `/[slug]` returns a placeholder from `generateStaticParams`.

## Current state
- **Repo:** https://github.com/affordabiz/automation (public). GitHub user `Haseeb-WebDeveloper` has write access.
  - `main` holds only the scaffold, spec and plan.
  - `feat/site-generator` holds all the work.
  - **PR #2** (`feat/site-generator` → `main`) is open. The user is merging it or will ask you to.
- **Vercel:** a new Affordabiz-owned account (not Figmenta). The project deploys `main` to https://automation-three-blond.vercel.app/. It showed the Next.js starter page because `main` doesn't have the app yet; merging PR #2 fixes that. The user has added the env vars from `.env.vercel` and set the Sanity CORS origin for that URL.
- **Sanity:** templates 1–7 are seeded. `template-1.copy.loans.partnerLogoUrl` was cleared on purpose, because taxprep.me blocks hotlinking. The page shows a "Refund Advantage" text wordmark instead.
- **Verified:**
  - Unit tests, typecheck and lint pass.
  - `next build` passes.
  - A local production server was checked: pages, the slug API, the live slug check, and template 1 at 375/768/1280 px with no overflow or console errors.
- **Not verified:** the Playwright e2e test. It needs a Sanity `test` dataset, which doesn't exist yet. Running it against `production` was blocked.

## Open issues / next steps
1. **Local dev error** "Could not find the module …next/dist/client/image-component.js#Image in the React Client Manifest". This is diagnosed but not yet fixed.
   - **Cause:** a stale Turbopack dev cache in `.next/dev` from before the React 19.3.0 → 19.3.1 bump, plus orphaned `next`/`next-sanity`/`visual-editing` copies in `node_modules` that aren't in the lockfile.
   - **Fix:** stop `pnpm dev`, then run `pnpm prune && rm -rf .next && pnpm dev`. No code change needed.
2. After PR #2 merges, check the live site: `/`, `/templates/1/preview`, `/create`, `/studio`. If the Vercel build fails, read the build log.
3. Set up the Sanity webhook:
   - URL: `https://automation-three-blond.vercel.app/api/revalidate`
   - Trigger: create/update/delete
   - Filter: `_type in ["site","template"]`
   - Projection: `{_type, "slug": slug.current}`
   - Secret: `SANITY_REVALIDATE_SECRET`
4. Before sharing publicly:
   - real Turnstile keys,
   - a sender on an authenticated domain in Brevo instead of the current Gmail address,
   - remove `BREVO_DRY_RUN` (currently `true` on Vercel, so no real emails go out),
   - turn off Brevo's Authorised-IPs blocking.
5. Content: paste the Refund Advantage/Pathward disclaimers and the remaining FAQ answers into Studio → Template 1. Empty items stay hidden.
6. Optional: create a Sanity `test` dataset, then run `pnpm e2e`.
7. Later: templates 2–7 (the user will send references) and a general form builder.

## Known limitation
Unknown slugs show the not-found page with `noindex`, but the HTTP status is 200, because Cache Components streams the page frame before the slug check finishes. This is accepted for now.
