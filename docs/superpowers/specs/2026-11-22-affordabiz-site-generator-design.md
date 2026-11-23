# Affordabiz Site Generator — Design

**Date:** 2026-11-22
**Status:** Approved (design), pending spec review

## Goal

A public onboarding form lets a business owner pick one of 7 webpage templates and supply their details. On submit, the system publishes a webpage at `yourdomain.com/{slug}` built from the chosen template with the owner's data, and emails the owner a link via Brevo. Each generated page has a contact form that emails visitor enquiries to the owner via Brevo.

## Decisions

| Topic | Decision |
|---|---|
| Form scope | Fixed onboarding form + per-site contact form, built in code. Field definitions live in one config array so a Sanity-driven form builder can replace it later. |
| Site URLs | Path-based: `/{slug}` |
| Contact recipient | Owner's onboarding email; `replyTo` = visitor |
| Access | Public form, site goes live instantly; spam protection + rate limiting; admins can unpublish in Studio |
| Templates | Template 1 fully built now; templates 2–7 registered as `coming-soon` until references are provided |
| Generation model | "Duplication" is logical: a `site` document references a template number + owner data; the template component renders it. No file or document copying. |
| Owner editing | None in v1 (admins edit in Studio). No auth, no payments. |

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack)
- Sanity (Content Lake + embedded Studio at `/studio`), `next-sanity`, `@sanity/image-url`
- Brevo transactional email API (`/v3/smtp/email`)
- Cloudflare Turnstile for bot protection
- zod for validation
- Vercel hosting

## Sanity Schema

### `template`
- `number` (1–7, unique) — `_id = template-{n}`
- `name` (string)
- `copy` (object): fixed text for the template's sections — hero tagline, cash-advance range, intro cards, services, FAQ items, client-form links, loan/Refund Advantage blocks, CTA, contact intro, footer. Strings may contain tokens: `{{fullName}}`, `{{businessName}}`, `{{email}}`, `{{phone}}`, `{{address}}`, `{{servingArea}}`.

### `site`
- `slug` (slug, unique, required)
- `templateNumber` (number 1–7, required)
- `fullName`, `businessName`, `email`, `phone`, `address`, `servingArea` (strings, required)
- `logo` (image, required), `photo` (image, required)
- `published` (boolean, default true)
- `createdAt` (datetime)

### `contactMessage` (log)
- `site` (reference → site), `name`, `email`, `phone`, `message`, `sentAt`, `emailStatus` (`sent` | `failed`)

## Routes

### `/create` — onboarding form
Fields: full name, business name, email, phone, address, serving area, slug, template (1–7), logo upload, photo upload.
- Slug auto-suggested from business name (kebab-case); live availability check via `GET /api/slug-available?slug=`.
- The check runs as soon as the user enters/changes the slug (debounced ~400 ms while typing, and again on blur). States shown inline under the field: "Checking…", "✓ Available", or "This address is already taken — please choose a different one" (with a clickable suggestion, e.g. `jane-doe-tax-2`). Invalid format shows its own message. The submit button stays disabled while the slug is taken, invalid, or still being checked. The server re-checks on submit (409) as the final guard.
- Template picker: 7 cards with preview image; "Preview" opens `/templates/{n}/preview` in a new tab. `coming-soon` templates are visible but not selectable.
- Uploads: `image/png|jpeg|webp|svg+xml` (svg logo only), ≤5 MB each, client-side preview.
- Turnstile widget; hidden honeypot field.
- On success: show the live URL and "check your email".

### `GET /api/slug-available`
Returns `{ available: boolean, suggestion?: string }`. Slug rules: `^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$`, not in reserved list (`studio`, `api`, `create`, `templates`, `_next`, `admin`, `favicon.ico`, `robots.txt`, `sitemap.xml`).

### `POST /api/sites` (multipart)
1. Verify Turnstile token; reject honeypot; rate-limit by IP (5/hour).
2. Validate fields with the shared zod schema.
3. Check slug availability → 409 with suggestion if taken.
4. Upload logo and photo to Sanity assets.
5. Create `site` document with `_id = site-{slug}` (no dots: Sanity treats dotted IDs as private) (`createIfNotExists` semantics guarantees uniqueness under races; on conflict delete uploaded assets, return 409).
6. Send "Your webpage is ready" email via Brevo to the owner with `https://{domain}/{slug}`.
7. Email failure does not fail the request — log it, still return `{ url }`.

### `/[slug]` — generated site
Fetches the published `site` + its `template` (by number), resolves tokens in copy, renders the matching template component. 404 if missing/unpublished or template not `live`. Cached with tag `site:{slug}`; a Sanity webhook → `POST /api/revalidate` calls `revalidateTag(tag, { expire: 0 })` on site/template changes; `POST /api/sites` also expires `site:{slug}` immediately so a previously-cached 404 is cleared. `generateMetadata` uses business name + serving area.

### `/templates/[n]/preview`
Renders template `n` with built-in sample data (Jane Doe Tax Service). `noindex`.

### `POST /api/contact/[slug]`
Body: name, email, phone (optional), message, Turnstile token, honeypot. Rate-limit by IP (10/hour). Sends a Brevo email to the owner (`replyTo` = visitor) with a branded HTML layout; logs a `contactMessage`. Returns 200 on send, 502 on Brevo failure (message still logged with `failed`).

## Code Structure

```
src/
  app/
    create/page.tsx              onboarding form page
    [slug]/page.tsx              generated site
    templates/[n]/preview/page.tsx
    studio/[[...tool]]/page.tsx  embedded Sanity Studio
    api/sites/route.ts
    api/slug-available/route.ts
    api/contact/[slug]/route.ts
    api/revalidate/route.ts
  forms/
    onboarding.fields.ts         field config array (future form-builder seam)
    onboarding.schema.ts         zod schema derived/shared client+server
  templates/
    registry.ts                  number → component, status
    types.ts                     SiteData, TemplateCopy, TemplateProps
    t1/                          Template 1 sections + index.tsx
  lib/
    sanity/{client,queries,image,write}.ts
    brevo.ts                     sendEmail()
    emails/{siteReady,contactMessage}.ts  HTML builders
    tokens.ts                    {{token}} replacement
    slug.ts                      validation, reserved list, suggestion
    turnstile.ts
    rateLimit.ts
  sanity/schemaTypes/{template,site,contactMessage}.ts
sanity.config.ts
```

Template status (`live` | `coming-soon`), display name and swatch live in code (`src/templates/catalog.ts`) because every template needs code anyway.

Every template component receives the same props `{ site: SiteData, copy: TemplateCopy }`, so adding templates 2–7 is: add a component folder, register it, create its `template` document.

## Template 1 Redesign

Keep the theme colours (dark teal ~`#0F5A4F`, orange ~`#F7941D`, light mint section background) and every paragraph verbatim from the reference. Modernise the layout, typography (serif display headings + clean sans body) and spacing; fully responsive.

Sections:
1. Header/nav: logo (dynamic), anchor links, "Hire Video" / "Signup" buttons
2. Hero: cash-advance range, **businessName**, "**fullName**, PTIN-Certified Tax Professional", "Servicing **servingArea**", mobile & virtual note, CTA; contact card with **phone**, **email**, **address**; IRS-certified badge; highlights list
3. Contact-our-professionals: **photo** + 3 info cards (verbatim copy)
4. My Services: summary line + 3 service cards (verbatim)
5. FAQ: accessible accordion (6 questions)
6. Client Forms: two groups of form-link buttons (fixed URLs)
7. Pre-pack loans + Refund Advantage block with disclaimers (verbatim)
8. "Ready To Get Started?" CTA
9. Contact Us: intro, **fullName**, **servingArea**, **phone**, **email**, contact form → `/api/contact/{slug}`
10. Footer (fixed text)

Dynamic: fullName, businessName, email, phone, address, servingArea, logo, photo. Everything else fixed (editable in the Sanity `template` doc).

## Emails (Brevo)

- **Site ready** — to owner: subject "Your webpage is ready — {businessName}", greeting, button link to the site, plain-text fallback.
- **Contact message** — to owner: subject "New enquiry from {visitorName} via your website", table of visitor fields, `replyTo` visitor.
Sender: a verified Brevo sender address configured via env.

## Environment

`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Error Handling

| Case | Behaviour |
|---|---|
| Validation error | 400 with per-field messages, shown inline |
| Slug taken / race | 409 + suggestion; uploaded assets cleaned up |
| Turnstile / honeypot fail | 403, generic message |
| Rate limit | 429 |
| Sanity upload/create fail | 500; no partial site doc |
| Brevo fail on site creation | site still created; error logged; success response |
| Brevo fail on contact | 502; message logged as `failed` |

## Testing

- Unit (Vitest): zod schema, slug rules/suggestion, token replacement, email HTML builders.
- Route tests: `/api/sites` and `/api/contact` with Sanity + Brevo + Turnstile mocked (success, 409, 400, email-failure paths).
- E2E (Playwright): fill `/create`, submit against a test Sanity dataset with Brevo mocked, visit `/{slug}`, submit contact form.
- Visual check of Template 1 at mobile/tablet/desktop.

## Out of Scope (v1)

Form builder UI, owner login/self-editing, payments, custom domains/subdomains, templates 2–7 designs (pending references), per-site copy overrides.

## Notes

The rate limiter is in-memory in v1, so on serverless it applies per instance. Swap it for Upstash/Vercel KV if abuse appears.
