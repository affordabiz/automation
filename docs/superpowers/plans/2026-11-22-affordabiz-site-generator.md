# Affordabiz Site Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public onboarding form creates a business webpage at `/{slug}` from one of 7 templates (template 1 built now), stores it in Sanity, emails the owner the link via Brevo, and each generated page has a contact form that emails the owner via Brevo.

**Architecture:** One Next.js 16 App Router app. A `site` document in Sanity holds the owner's data + template number; `/[slug]` renders the matching React template component with token-resolved copy from a Sanity `template` document (falling back to defaults in code). Route handlers do validation (zod), bot protection (Turnstile), rate limiting, Sanity writes and Brevo sends. Data reads use `"use cache"` + `cacheTag`, invalidated with `revalidateTag(tag, { expire: 0 })`.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents`, React Compiler, Turbopack), React 19.3, TypeScript 5, Tailwind CSS v4, Sanity (`next-sanity`, embedded Studio), zod v4, Brevo REST API, Cloudflare Turnstile (`@marsidev/react-turnstile`), lucide-react, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-22-affordabiz-site-generator-design.md`

## Global Constraints

- Site URLs are path-based: `{NEXT_PUBLIC_SITE_URL}/{slug}`.
- Slug rule: `^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$`, no `--`; reserved: `studio`, `api`, `create`, `templates`, `_next`, `admin`, `favicon.ico`, `robots.txt`, `sitemap.xml`.
- Slug availability is checked live while typing (debounced 400 ms) and on blur; the submit button is disabled unless the slug is confirmed available; the server re-checks (409) on submit.
- Site document ID is `site-{slug}`; template document ID is `template-{n}`. Never use dots in IDs.
- Uploads: logo `image/png|jpeg|webp|svg+xml`, photo `image/png|jpeg|webp`, each ≤ 5 MB.
- Rate limits: `POST /api/sites` 5/hour/IP, `POST /api/contact/[slug]` 10/hour/IP, `GET /api/slug-available` 60/minute/IP.
- Template 1 keeps the theme colours (teal `#0E5A4E`, deep teal `#0A453C`, orange `#F7931E`, mint `#EAF3F0`, crimson `#B5223D`) and all paragraphs verbatim from `src/templates/t1/defaultCopy.ts`. Do not reword copy.
- Next.js 16 rules: always `await params`; `revalidateTag` must take a second argument (`{ expire: 0 }`); no `export const dynamic`/`revalidate` route segment config (incompatible with `cacheComponents`); never call `new Date()`/`Math.random()` in server components that render pages.
- Email failure on site creation must NOT fail the request.
- No auth, no payments, no owner self-editing in v1.

## Human Prerequisites (before Task 8)

These cannot be automated; collect the values into `.env.local`:
1. **Sanity:** create a project at sanity.io/manage; datasets `production` and `test` (both public). Create an API token with **Editor** rights → `SANITY_API_WRITE_TOKEN`. Add CORS origins `http://localhost:3000` (allow credentials) and the production domain.
2. **Brevo:** API key (SMTP & API → API keys) → `BREVO_API_KEY`; a verified sender address → `BREVO_SENDER_EMAIL`.
3. **Cloudflare Turnstile:** create a widget for the production domain + `localhost` → site key and secret. For local dev you can use Cloudflare's always-pass test keys: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
4. **Sanity webhook** (after deploy): sanity.io/manage → API → Webhooks → URL `{domain}/api/revalidate`, dataset `production`, trigger on create/update/delete, filter `_type in ["site","template"]`, projection `{_type, "slug": slug.current}`, secret = `SANITY_REVALIDATE_SECRET`.

## Content To Supply (non-blocking)

The verbatim text for these could not be extracted from the reference page. Admins paste it into Sanity Studio → Template 1 after seeding; the page hides empty items:
- FAQ answer for "What Proof of Identification Will I Need to Provide?" and the full answer text for the income/tax-docs/credits questions (defaults currently contain only the Client Document Checklist link).
- The 4 numbered Refund Advantage / Pathward disclaimers (`copy.loans.disclaimers`). The disclaimer block is hidden until filled.

## File Map

```
.env.example                              env var template
vitest.config.ts                          unit test config
playwright.config.ts                      e2e config
sanity.config.ts                          Studio config
scripts/seed-templates.ts                 seeds template-1..7 docs
test/server-only-stub.ts                  stub for 'server-only' in vitest
e2e/onboarding.spec.ts, e2e/fixtures/pixel.png
src/app/
  layout.tsx, globals.css, page.tsx       app shell + landing
  create/page.tsx                         onboarding page (server)
  create/OnboardingForm.tsx               onboarding form (client)
  create/ImageInput.tsx                   file input with preview (client)
  create/useSlugAvailability.ts           live slug check hook (client)
  [slug]/page.tsx                         generated site
  templates/[n]/preview/page.tsx          template preview with sample data
  studio/[[...tool]]/page.tsx             embedded Studio
  api/slug-available/route.ts
  api/sites/route.ts
  api/contact/[slug]/route.ts
  api/revalidate/route.ts
src/forms/
  onboarding.fields.ts                    field config (future form-builder seam)
  onboarding.schema.ts                    zod parsing of FormData
  contact.schema.ts                       zod schema for contact messages
src/lib/
  slug.ts                                 pure slug rules / slugify / suggest
  slugCheck.ts                            server: availability check
  tokens.ts                               {{token}} replacement
  richText.ts                             tiny markdown parser (bold, links, bullets)
  mergeCopy.ts                            CMS copy over defaults
  rateLimit.ts                            in-memory limiter + clientIp
  turnstile.ts                            server-side token verify
  brevo.ts                                sendEmail()
  siteUrl.ts                              absolute site URL
  emails/escape.ts, emails/layout.ts, emails/siteReady.ts, emails/contactMessage.ts
  sanity/env.ts, sanity/client.ts, sanity/queries.ts, sanity/write.ts, sanity/withKeys.ts
src/sanity/schemaTypes/
  index.ts, linkItem.ts, template.ts, site.ts, contactMessage.ts
src/templates/
  types.ts                                SiteData, TemplateCopy, TemplateProps
  catalog.ts                              pure metadata: name/status/swatch
  defaults.ts                             default copy per template number
  sample.ts                               preview sample site
  registry.tsx                            number → component
  RichText.tsx                            renders richText blocks
  t1/defaultCopy.ts, t1/theme.ts, t1/index.tsx
  t1/Header.tsx, Hero.tsx, Intro.tsx, Services.tsx, Faq.tsx, ClientForms.tsx,
  t1/Loans.tsx, Cta.tsx, Contact.tsx, ContactForm.tsx, Footer.tsx
public/samples/logo.svg, public/samples/photo.svg
```

---

### Task 1: Project foundation

**Files:**
- Modify: `package.json`, `src/app/layout.tsx`, `src/app/globals.css`
- Create: `.env.example`, `vitest.config.ts`, `test/server-only-stub.ts`, `src/lib/siteUrl.ts`, `src/lib/siteUrl.test.ts`

**Interfaces:**
- Produces: `siteUrl(slug: string): string`; npm scripts `test`, `typecheck`, `seed`, `e2e`.

- [ ] **Step 1: Ensure the scaffold install finished**

Run: `ls node_modules/next/package.json`
If missing, run `npm install`. Expected: `node_modules/next` exists.

- [ ] **Step 2: Initialise git**

Run: `git init && git add -A && git commit -m "chore: scaffold Next.js 16 app and design spec"`
Check `.gitignore` contains `.env*` (create-next-app adds it). Expected: one commit.

- [ ] **Step 3: Install dependencies**

```bash
npm install next-sanity sanity styled-components zod @marsidev/react-turnstile lucide-react server-only
npm install -D vitest tsx @playwright/test
```
Expected: exits 0. If npm reports an `ERESOLVE` peer conflict, stop and report the exact message (do not use `--force`).

- [ ] **Step 4: Add scripts to `package.json`**

Replace the `"scripts"` block with:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test",
  "seed": "tsx --env-file=.env.local scripts/seed-templates.ts"
}
```

- [ ] **Step 5: Create `vitest.config.ts` and the server-only stub**

```ts
// vitest.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
```
```ts
// test/server-only-stub.ts
export {};
```

- [ ] **Step 6: Create `.env.example`**

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=
SANITY_REVALIDATE_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Affordabiz
# Set to 1 to log emails instead of sending (used by e2e)
BREVO_DRY_RUN=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```
Then `cp .env.example .env.local` (values filled in by a human later).

- [ ] **Step 7: Write the failing test for `siteUrl`**

```ts
// src/lib/siteUrl.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "./siteUrl";

afterEach(() => vi.unstubAllEnvs());

describe("siteUrl", () => {
  it("joins base and slug without double slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    expect(siteUrl("jane-doe")).toBe("https://example.com/jane-doe");
  });
  it("falls back to localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteUrl("x1y")).toBe("http://localhost:3000/x1y");
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `npx vitest run src/lib/siteUrl.test.ts`
Expected: FAIL — cannot find module `./siteUrl`.

- [ ] **Step 9: Implement**

```ts
// src/lib/siteUrl.ts
export function siteUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/${slug}`;
}
```

- [ ] **Step 10: Replace `src/app/globals.css` and `src/app/layout.tsx`**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html {
  scroll-behavior: smooth;
}

body {
  background: #ffffff;
  color: #171717;
}
```
```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Affordabiz — Your business webpage in minutes",
  description: "Pick a template, fill in your details and get a professional webpage instantly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 11: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: 2 tests PASS; tsc exits 0.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: add deps, vitest, env template and siteUrl helper"
```

---

### Task 2: Slug utilities

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/slug.test.ts`

**Interfaces:**
- Produces:
  - `SLUG_PATTERN: RegExp`, `RESERVED_SLUGS: ReadonlySet<string>`
  - `SLUG_FORMAT_MESSAGE`, `RESERVED_MESSAGE`, `TAKEN_MESSAGE: string`
  - `isValidSlugFormat(s: string): boolean`, `isReservedSlug(s: string): boolean`
  - `slugify(input: string): string`
  - `suggestSlug(base: string, isTaken: (s: string) => Promise<boolean>, max?: number): Promise<string | undefined>`
  - `type SlugCheckResponse = { available: true } | { available: false; reason: "invalid" | "reserved" | "taken"; message: string; suggestion?: string }`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/slug.test.ts
import { describe, expect, it } from "vitest";
import { isReservedSlug, isValidSlugFormat, slugify, suggestSlug } from "./slug";

describe("isValidSlugFormat", () => {
  it.each(["abc", "jane-doe-tax", "a1b", "x".repeat(50)])("accepts %s", (s) => {
    expect(isValidSlugFormat(s)).toBe(true);
  });
  it.each(["ab", "-abc", "abc-", "Abc", "a b", "a--b", "x".repeat(51), "café"])("rejects %s", (s) => {
    expect(isValidSlugFormat(s)).toBe(false);
  });
});

describe("isReservedSlug", () => {
  it("flags app routes", () => {
    expect(isReservedSlug("studio")).toBe(true);
    expect(isReservedSlug("create")).toBe(true);
    expect(isReservedSlug("jane")).toBe(false);
  });
});

describe("slugify", () => {
  it("kebab-cases names", () => {
    expect(slugify("Jane Doe Tax Service")).toBe("jane-doe-tax-service");
  });
  it("strips accents and expands &", () => {
    expect(slugify("  Café & Co. ")).toBe("cafe-and-co");
  });
  it("caps length at 50 without trailing hyphen", () => {
    const s = slugify("a".repeat(49) + " b");
    expect(s.length).toBeLessThanOrEqual(50);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("suggestSlug", () => {
  it("returns the first free numbered variant", async () => {
    const taken = new Set(["jane-2"]);
    expect(await suggestSlug("jane", async (s) => taken.has(s))).toBe("jane-3");
  });
  it("returns undefined when every candidate is taken", async () => {
    expect(await suggestSlug("jane", async () => true, 3)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/slug.ts
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "studio", "api", "create", "templates", "_next", "admin",
  "favicon.ico", "robots.txt", "sitemap.xml",
]);

export const SLUG_FORMAT_MESSAGE =
  "Use 3–50 lowercase letters, numbers or single hyphens (no hyphen at the start or end).";
export const RESERVED_MESSAGE = "This address is reserved — please choose a different one.";
export const TAKEN_MESSAGE = "This address is already taken — please choose a different one.";

export type SlugCheckResponse =
  | { available: true }
  | {
      available: false;
      reason: "invalid" | "reserved" | "taken";
      message: string;
      suggestion?: string;
    };

export function isValidSlugFormat(s: string): boolean {
  return SLUG_PATTERN.test(s) && !s.includes("--");
}

export function isReservedSlug(s: string): boolean {
  return RESERVED_SLUGS.has(s);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
}

export async function suggestSlug(
  base: string,
  isTaken: (s: string) => Promise<boolean>,
  max = 20,
): Promise<string | undefined> {
  const root = base.slice(0, 46).replace(/-+$/, "");
  for (let n = 2; n <= max; n++) {
    const candidate = `${root}-${n}`;
    if (!isValidSlugFormat(candidate) || isReservedSlug(candidate)) continue;
    if (!(await isTaken(candidate))) return candidate;
  }
  return undefined;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat: slug validation, slugify and suggestions"
```

---

### Task 3: Template types, tokens, rich text, copy merging, Sanity keys

**Files:**
- Create: `src/templates/types.ts`, `src/lib/tokens.ts`, `src/lib/tokens.test.ts`, `src/lib/richText.ts`, `src/lib/richText.test.ts`, `src/lib/mergeCopy.ts`, `src/lib/mergeCopy.test.ts`, `src/lib/sanity/withKeys.ts`, `src/lib/sanity/withKeys.test.ts`

**Interfaces:**
- Produces:
  - Types `LinkItem`, `SiteData`, `TemplateCopy`, `TemplateProps` (below)
  - `type TokenValues = Record<string, string>`; `siteTokenValues(site: SiteData): TokenValues`; `resolveString(s: string, v: TokenValues): string`; `resolveTokens<T>(value: T, v: TokenValues): T`
  - `type Inline`, `type Block`; `parseInline(text: string): Inline[]`; `parseRichText(text: string): Block[]`
  - `mergeCopy<T>(base: T, override: unknown): T`
  - `withKeys<T>(value: T, prefix?: string): T`

- [ ] **Step 1: Create `src/templates/types.ts`**

```ts
// src/templates/types.ts
export interface LinkItem {
  label: string;
  url: string;
}

export interface SiteData {
  /** Sanity document id, null for previews */
  id: string | null;
  /** null for previews (contact form disabled) */
  slug: string | null;
  templateNumber: number;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  servingArea: string;
  logoUrl: string;
  photoUrl: string;
}

export interface TemplateCopy {
  nav: LinkItem[];
  headerButtons: LinkItem[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    servingLine: string;
    availability: string;
    ctaLabel: string;
    badge: string;
    contactLabel: string;
    notes: string[];
  };
  highlights: string[];
  intro: { heading: string; cards: { body: string }[] };
  services: { heading: string; ctaLabel: string; items: { title: string; body: string }[] };
  faq: { heading: string; items: { question: string; answer: string }[] };
  forms: {
    heading: string;
    groups: { heading: string; links: LinkItem[] }[];
    portalLink: LinkItem;
  };
  loans: {
    promoLines: string[];
    promoBadge: string;
    partnerLogoUrl: string;
    partnerName: string;
    cards: { title: string; detail: string }[];
    disclaimers: string[];
  };
  cta: { heading: string; buttonLabel: string };
  contact: { heading: string; intro: string; credentialLine: string };
  footer: { text: string; links: LinkItem[] };
}

export interface TemplateProps {
  site: SiteData;
  copy: TemplateCopy;
}
```

- [ ] **Step 2: Write failing tests for tokens, richText, mergeCopy, withKeys**

```ts
// src/lib/tokens.test.ts
import { describe, expect, it } from "vitest";
import { resolveString, resolveTokens, siteTokenValues } from "./tokens";
import type { SiteData } from "@/templates/types";

const site: SiteData = {
  id: "site-jane", slug: "jane", templateNumber: 1, fullName: "Jane Doe",
  businessName: "Jane Doe Tax Service", email: "j@x.com", phone: "1",
  address: "Atlanta", servingArea: "Atlanta & Surrounding States",
  logoUrl: "/l.svg", photoUrl: "/p.svg",
};

describe("tokens", () => {
  it("replaces known tokens and tolerates spaces", () => {
    expect(resolveString("Hi {{ fullName }} of {{businessName}}", siteTokenValues(site)))
      .toBe("Hi Jane Doe of Jane Doe Tax Service");
  });
  it("leaves unknown tokens untouched", () => {
    expect(resolveString("{{nope}}", {})).toBe("{{nope}}");
  });
  it("resolves deeply in objects and arrays without mutating input", () => {
    const input = { a: ["Servicing {{servingArea}}"], b: { c: "{{phone}}" }, n: 3 };
    const out = resolveTokens(input, siteTokenValues(site));
    expect(out).toEqual({ a: ["Servicing Atlanta & Surrounding States"], b: { c: "1" }, n: 3 });
    expect(input.a[0]).toBe("Servicing {{servingArea}}");
  });
});
```
```ts
// src/lib/richText.test.ts
import { describe, expect, it } from "vitest";
import { parseInline, parseRichText } from "./richText";

describe("parseInline", () => {
  it("parses bold and safe links", () => {
    expect(parseInline("See **this** and [IRS](https://irs.gov) now")).toEqual([
      { type: "text", value: "See " },
      { type: "bold", value: "this" },
      { type: "text", value: " and " },
      { type: "link", label: "IRS", href: "https://irs.gov" },
      { type: "text", value: " now" },
    ]);
  });
  it("renders unsafe links as plain text", () => {
    expect(parseInline("[x](javascript:alert(1))")).toEqual([{ type: "text", value: "x" }]);
  });
});

describe("parseRichText", () => {
  it("groups paragraphs and bullet lists", () => {
    const blocks = parseRichText("Line one\nline two\n\n- a\n- **b**\nAfter");
    expect(blocks).toEqual([
      { type: "p", content: [{ type: "text", value: "Line one line two" }] },
      { type: "ul", items: [[{ type: "text", value: "a" }], [{ type: "bold", value: "b" }]] },
      { type: "p", content: [{ type: "text", value: "After" }] },
    ]);
  });
  it("returns no blocks for empty text", () => {
    expect(parseRichText("  \n ")).toEqual([]);
  });
});
```
```ts
// src/lib/mergeCopy.test.ts
import { describe, expect, it } from "vitest";
import { mergeCopy } from "./mergeCopy";

const base = { title: "Base", list: ["a"], nested: { x: "1", y: "2" } };

describe("mergeCopy", () => {
  it("returns base for null/undefined override", () => {
    expect(mergeCopy(base, null)).toBe(base);
  });
  it("overrides non-empty strings and non-empty arrays", () => {
    expect(mergeCopy(base, { title: "CMS", list: ["b", "c"], nested: { y: "9" } })).toEqual({
      title: "CMS", list: ["b", "c"], nested: { x: "1", y: "9" },
    });
  });
  it("keeps base for empty strings/arrays and wrong types, ignores extra keys", () => {
    expect(mergeCopy(base, { title: "  ", list: [], nested: "oops", _type: "copy" })).toEqual(base);
  });
});
```
```ts
// src/lib/sanity/withKeys.test.ts
import { describe, expect, it } from "vitest";
import { withKeys } from "./withKeys";

describe("withKeys", () => {
  it("adds unique _key to objects inside arrays, leaves strings alone", () => {
    const out = withKeys({ items: [{ a: 1 }, { a: 2, sub: [{ b: 1 }] }], tags: ["x"] });
    expect(out.items[0]).toMatchObject({ _key: expect.any(String), a: 1 });
    expect(out.items[0]._key).not.toBe(out.items[1]._key);
    expect(out.items[1].sub[0]).toMatchObject({ _key: expect.any(String), b: 1 });
    expect(out.tags).toEqual(["x"]);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test`
Expected: the four new test files FAIL with module-not-found.

- [ ] **Step 4: Implement**

```ts
// src/lib/tokens.ts
import type { SiteData } from "@/templates/types";

export type TokenValues = Record<string, string>;

const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;

export function siteTokenValues(site: SiteData): TokenValues {
  return {
    fullName: site.fullName,
    businessName: site.businessName,
    email: site.email,
    phone: site.phone,
    address: site.address,
    servingArea: site.servingArea,
  };
}

export function resolveString(s: string, values: TokenValues): string {
  return s.replace(TOKEN, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

export function resolveTokens<T>(value: T, values: TokenValues): T {
  if (typeof value === "string") return resolveString(value, values) as T;
  if (Array.isArray(value)) return value.map((v) => resolveTokens(v, values)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveTokens(v, values)]),
    ) as T;
  }
  return value;
}
```
```ts
// src/lib/richText.ts
export type Inline =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; label: string; href: string };

export type Block = { type: "p"; content: Inline[] } | { type: "ul"; items: Inline[][] };

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|#)/i;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ type: "text", value: text.slice(last, idx) });
    if (m[1] !== undefined) out.push({ type: "bold", value: m[1] });
    else if (SAFE_HREF.test(m[3])) out.push({ type: "link", label: m[2], href: m[3] });
    else out.push({ type: "text", value: m[2] });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Inline[][] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", content: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "ul", items: list });
    list = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(parseInline(line.slice(2).trim()));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
```
```ts
// src/lib/mergeCopy.ts
/**
 * Deep-merges CMS copy over code defaults. Only keys present in `base` are kept.
 * Non-empty strings and non-empty arrays from `override` win; everything else falls back.
 */
export function mergeCopy<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) && override.length > 0 ? override : base) as T;
  }
  if (typeof base === "string") {
    return (typeof override === "string" && override.trim() !== "" ? override : base) as T;
  }
  if (base && typeof base === "object") {
    if (typeof override !== "object" || Array.isArray(override)) return base;
    const src = override as Record<string, unknown>;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(out)) out[key] = mergeCopy(out[key], src[key]);
    return out as T;
  }
  return base;
}
```
```ts
// src/lib/sanity/withKeys.ts
/** Adds the `_key` Sanity requires on every object inside an array. Pure; relative imports only (used by scripts). */
export function withKeys<T>(value: T, prefix = "k"): T {
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      const inner = withKeys(item, `${prefix}${i}-`);
      return inner && typeof inner === "object" && !Array.isArray(inner)
        ? { _key: `${prefix}${i}`, ...inner }
        : inner;
    }) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, withKeys(v, `${prefix}${k}-`)]),
    ) as T;
  }
  return value;
}
```
Note: in `withKeys.test.ts` the result is typed as the input type, so `out.items[0]._key` is a TS error. Cast at the top of the test: `const out = withKeys(...) as unknown as { items: Array<{ _key: string; a: number; sub: Array<{ _key: string }> }>; tags: string[] };`.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS, tsc exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/templates/types.ts src/lib
git commit -m "feat: template types, token resolution, rich text and copy merging"
```

---

### Task 4: Template catalog, Template 1 default copy, sample site

**Files:**
- Create: `src/templates/catalog.ts`, `src/templates/catalog.test.ts`, `src/templates/t1/defaultCopy.ts`, `src/templates/defaults.ts`, `src/templates/sample.ts`, `public/samples/logo.svg`, `public/samples/photo.svg`

**Interfaces:**
- Consumes: `TemplateCopy`, `SiteData` (Task 3)
- Produces:
  - `type TemplateStatus = "live" | "coming-soon"`; `interface TemplateMeta { number: number; name: string; status: TemplateStatus; swatch: readonly [string, string] }`
  - `TEMPLATE_CATALOG: readonly TemplateMeta[]`, `getTemplateMeta(n: number): TemplateMeta | undefined`, `isLiveTemplate(n: number): boolean`
  - `T1_DEFAULT_COPY: TemplateCopy`; `DEFAULT_COPY: Partial<Record<number, TemplateCopy>>`; `getDefaultCopy(n: number): TemplateCopy | null`
  - `sampleSite(templateNumber: number): SiteData`

These files must use **relative** imports (they are also imported by `scripts/seed-templates.ts` via tsx).

- [ ] **Step 1: Write failing test**

```ts
// src/templates/catalog.test.ts
import { describe, expect, it } from "vitest";
import { TEMPLATE_CATALOG, getTemplateMeta, isLiveTemplate } from "./catalog";
import { getDefaultCopy } from "./defaults";

describe("catalog", () => {
  it("has 7 templates numbered 1..7", () => {
    expect(TEMPLATE_CATALOG.map((t) => t.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("only template 1 is live in v1", () => {
    expect(isLiveTemplate(1)).toBe(true);
    expect(isLiveTemplate(2)).toBe(false);
    expect(isLiveTemplate(99)).toBe(false);
    expect(getTemplateMeta(1)?.name).toBe("Classic Tax Pro");
  });
  it("every live template has default copy", () => {
    for (const t of TEMPLATE_CATALOG.filter((t) => t.status === "live")) {
      expect(getDefaultCopy(t.number)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/templates/catalog.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement catalog**

```ts
// src/templates/catalog.ts
export type TemplateStatus = "live" | "coming-soon";

export interface TemplateMeta {
  number: number;
  name: string;
  status: TemplateStatus;
  swatch: readonly [string, string];
}

export const TEMPLATE_CATALOG: readonly TemplateMeta[] = [
  { number: 1, name: "Classic Tax Pro", status: "live", swatch: ["#0E5A4E", "#F7931E"] },
  { number: 2, name: "Template 2", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 3, name: "Template 3", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 4, name: "Template 4", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 5, name: "Template 5", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 6, name: "Template 6", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 7, name: "Template 7", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
];

export function getTemplateMeta(n: number): TemplateMeta | undefined {
  return TEMPLATE_CATALOG.find((t) => t.number === n);
}

export function isLiveTemplate(n: number): boolean {
  return getTemplateMeta(n)?.status === "live";
}
```

- [ ] **Step 4: Create Template 1 default copy (verbatim — do not edit wording)**

```ts
// src/templates/t1/defaultCopy.ts
import type { TemplateCopy } from "../types";

const CHECKLIST_URL =
  "https://www.taxprep.me/wp-content/uploads/2025/12/Tax-Preparation-Client-Checklist.pdf";

export const T1_DEFAULT_COPY: TemplateCopy = {
  nav: [
    { label: "Home", url: "#home" },
    { label: "About", url: "#about" },
    { label: "Services", url: "#services" },
    { label: "FAQ", url: "#faq" },
    { label: "Client Forms", url: "#forms" },
    { label: "Cash Advance", url: "#cash-advance" },
    { label: "Contact", url: "#contact" },
  ],
  headerButtons: [
    { label: "Hiree Video", url: "https://www.taxbizinbox.com/video/" },
    {
      label: "Hiree Signup",
      url: "https://trainings.affordataxbizbox.com/bundles/2026-new-ptin-partners-ahs-hirees?th__ug=f93fa8ea",
    },
  ],
  hero: {
    eyebrow: "$250-$7,500 Cash Advance",
    title: "{{businessName}}",
    subtitle: "{{fullName}}, PTIN-Certified Tax Professional",
    servingLine: "Servicing {{servingArea}}",
    availability: "Mobile & Virtual Service Available",
    ctaLabel: "Learn More",
    badge: "IRS-Certified Tax Professional",
    contactLabel: "Contact Me Today",
    notes: ["Taxes?", "Refunds?", "Need Help?", "Call Us!"],
  },
  highlights: [
    "Small Business & Individual Tax Return Preparation",
    "Quality Services at an Affordable Price",
    "Personalized and Confidential Service",
    "Expert and Up-To-Date Knowledge",
    "Peace of Mind",
    "Convenience with Mobile & Drop-Off Services",
  ],
  intro: {
    heading: "Contact our tax professionals today.",
    cards: [
      {
        body: "Be the first to get your refund...get your return in the queue as SOON as you get your tax docs....don't forget the HealthCare.gov form because that will delay your refund if it's not included on your return the first time!",
      },
      {
        body: "Don't try to do your own taxes. In these days of COVID, tax laws are being created to help citizens through the pandemic. Professional help, as well as professional tax software is a MUST to ensure you get the biggest refund the IRS allows.",
      },
      {
        body: "Get an advance on your tax refund fast with free E-Service. Get the option to have your tax prep fee deducted from your refund. Get the best professional tax help that you could require...we are here to help!",
      },
    ],
  },
  services: {
    heading: "My Services",
    ctaLabel: "Book an Appointment",
    items: [
      {
        title: "Tax Return Preparation",
        body: "We specialize in Individual and Small Business tax prep services. We understand the importance of filing your taxes correctly and on time. We offer several options to get started: upload your tax docs on our secure & encrypted automated platform, drop-off service or you can set an appointment.",
      },
      {
        title: "Amended Returns",
        body: "Let us handle any changes you want made to previous returns. You'll feel better - breathe a BIG sigh of relief and feel confident knowing your return(s) have been completed, filed and accepted by the IRS.",
      },
      {
        title: "Delinquent Returns",
        body: "This happens to the best of us... you're not by yourself and many times it's not your fault. However, the reality is this, late returns have have to be filed in order for you to get back into compliance with the IRS.",
      },
    ],
  },
  faq: {
    heading: "FAQ",
    items: [
      {
        question: "Where's My Refund? Where's My Check or Deposit?",
        answer: [
          "- [Check with IRS for Current Year Returns](https://sa.www4.irs.gov/irfof/lang/en/irfofgetstatus.jsp)",
          "- [Check with IRS for Amended Returns](https://www.irs.gov/filing/wheres-my-amended-return)",
          "- [Check with Refund Advantage – (866) 876-6648 or www.TaxPayerInfo.com](https://www.taxpayerinfo.com/)",
        ].join("\n"),
      },
      { question: "What Proof of Identification Will I Need to Provide?", answer: "" },
      {
        question: "What Proof of Income Will I Need to Provide?",
        answer: `[Client Document Checklist](${CHECKLIST_URL})`,
      },
      {
        question: "What Tax Docs Should I Provide?",
        answer: `[Client Document Checklist](${CHECKLIST_URL})`,
      },
      {
        question: "What Docs or Proof Do I Need to Provide for Credits/Deductions?",
        answer: `[Client Document Checklist](${CHECKLIST_URL})`,
      },
      {
        question: "What Forms Do I Need to Get Started/Sign for Compliance?",
        answer: [
          "- [Client Intake form](https://form.jotform.com/70088014642148)",
          "- [EIC Validation form](https://form.jotform.com/70088014642148)",
          "- [Schedule C (Self-Employment) Validation form](https://form.jotform.com/70087171264151)",
          `- [Client Document Checklist](${CHECKLIST_URL})`,
          "",
          "- Bank Product",
          "- Consent Doc",
          "- E-File Signature Authorization",
        ].join("\n"),
      },
    ],
  },
  forms: {
    heading: "Client Forms",
    groups: [
      {
        heading: "Documents That Clients Need To Provide To Tax Professional",
        links: [
          { label: "Client In-Take Form", url: "https://www.taxprep.me/intake/" },
          { label: "Client Document Checklist", url: CHECKLIST_URL },
        ],
      },
      {
        heading: "Compliance Docs For Clients To Sign After Returns Are Completed",
        links: [
          { label: "EIC Validation Form", url: "https://www.taxprep.me/intake/" },
          { label: "Schedule C (Self-Employment) Validation Form", url: "https://www.taxprep.me/intake/" },
        ],
      },
    ],
    portalLink: {
      label: "Client Portal/Upload Tax Docs",
      url: "https://www.taxofficemanagement.com/CustomerPortal/Account/Login",
    },
  },
  loans: {
    promoLines: ["Pre-Pack Loans", "Are Here!"],
    promoBadge: "Available Starting January 2",
    partnerLogoUrl: "https://taxprep.me/wp-content/uploads/2020/10/Refund-ADvantage.jpg",
    partnerName: "Refund Advantage",
    cards: [
      { title: "No-Cost Taxpayer Refund Advance Loans", detail: "Loans of $250, $500, & $1,000" },
      {
        title: "Interest-Bearing Taxpayer Refund Advance Loans",
        detail: "36% APR on loans between $1,250 to $7,500",
      },
    ],
    disclaimers: [],
  },
  cta: { heading: "Ready To Get Started?", buttonLabel: "Schedule a Free Consultation" },
  contact: {
    heading: "Contact Us",
    intro: "We'd love to get connected with you about any of my tax services.",
    credentialLine: "{{fullName}}, Certified-PTIN Holder",
  },
  footer: {
    text: "© TaxPrep.me. All rights reserved. This website and all contractor pages hosted under the TaxPrep.me domain are governed by our Privacy Policy and Terms and Conditions. By using this site, you agree to these policies.",
    links: [
      { label: "Privacy Policy", url: "https://www.taxprep.me/privacy-policy-2/" },
      { label: "Terms and Conditions", url: "https://www.taxprep.me/term-condition/" },
    ],
  },
};
```

- [ ] **Step 5: Defaults map and sample site**

```ts
// src/templates/defaults.ts
import type { TemplateCopy } from "./types";
import { T1_DEFAULT_COPY } from "./t1/defaultCopy";

export const DEFAULT_COPY: Partial<Record<number, TemplateCopy>> = { 1: T1_DEFAULT_COPY };

export function getDefaultCopy(n: number): TemplateCopy | null {
  return DEFAULT_COPY[n] ?? null;
}
```
```ts
// src/templates/sample.ts
import type { SiteData } from "./types";

export function sampleSite(templateNumber: number): SiteData {
  return {
    id: null,
    slug: null,
    templateNumber,
    fullName: "Jane Doe",
    businessName: "Jane Doe Tax Service",
    email: "janedoetaxes@gmail.com",
    phone: "(404) 111-2222",
    address: "Atlanta, GA",
    servingArea: "Atlanta & Surrounding States",
    logoUrl: "/samples/logo.svg",
    photoUrl: "/samples/photo.svg",
  };
}
```

- [ ] **Step 6: Sample images**

```svg
<!-- public/samples/logo.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96" viewBox="0 0 320 96">
  <rect width="320" height="96" rx="12" fill="#ffffff"/>
  <circle cx="48" cy="48" r="28" fill="#F7931E"/>
  <text x="48" y="57" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#ffffff">JD</text>
  <text x="92" y="44" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#0E5A4E">Your Logo</text>
  <text x="92" y="68" font-family="Arial, sans-serif" font-size="13" fill="#0E5A4E">Tax Service</text>
</svg>
```
```svg
<!-- public/samples/photo.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720">
  <rect width="600" height="720" fill="#EAF3F0"/>
  <circle cx="300" cy="270" r="120" fill="#0E5A4E" opacity="0.85"/>
  <path d="M90 720c0-140 94-230 210-230s210 90 210 230z" fill="#0E5A4E" opacity="0.85"/>
  <text x="300" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#ffffff">Your Photo</text>
</svg>
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test && npm run typecheck` — Expected: PASS, exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/templates public/samples
git commit -m "feat: template catalog, template 1 default copy and sample data"
```

---

### Task 5: Form field config and validation schemas

**Files:**
- Create: `src/forms/onboarding.fields.ts`, `src/forms/onboarding.schema.ts`, `src/forms/onboarding.schema.test.ts`, `src/forms/contact.schema.ts`, `src/forms/contact.schema.test.ts`

**Interfaces:**
- Consumes: `isValidSlugFormat`, `isReservedSlug`, `SLUG_FORMAT_MESSAGE`, `RESERVED_MESSAGE` (Task 2); `isLiveTemplate` (Task 4)
- Produces:
  - `type FieldType`, `interface FieldDef`, `ONBOARDING_FIELDS` (readonly array), `type OnboardingFieldName`
  - `interface OnboardingData { fullName; businessName; email; phone; address; servingArea; slug: string; templateNumber: number }`
  - `type FieldErrors = Partial<Record<string, string[]>>`
  - `parseOnboarding(form: FormData): { success: true; data: OnboardingData; logo: File; photo: File } | { success: false; errors: FieldErrors }`
  - `contactSchema` (zod), `type ContactInput = z.infer<typeof contactSchema>`

- [ ] **Step 1: Field config**

```ts
// src/forms/onboarding.fields.ts
/**
 * Single source of truth for the onboarding form. A future form builder can
 * load this array from Sanity instead of code without changing consumers.
 */
export type FieldType = "text" | "email" | "tel" | "textarea" | "slug" | "template" | "image";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  maxLength?: number;
  placeholder?: string;
  help?: string;
  autoComplete?: string;
  accept?: readonly string[];
  maxBytes?: number;
  /** which template value this field fills */
  templateSlot?: string;
}

const MB5 = 5 * 1024 * 1024;

export const ONBOARDING_FIELDS = [
  { name: "fullName", label: "Full name", type: "text", maxLength: 100, autoComplete: "name", templateSlot: "fullName" },
  { name: "businessName", label: "Business name", type: "text", maxLength: 120, autoComplete: "organization", templateSlot: "businessName" },
  {
    name: "email", label: "Email", type: "email", maxLength: 254, autoComplete: "email",
    help: "We'll send your webpage link here. Messages from your webpage's contact form come here too.",
    templateSlot: "email",
  },
  { name: "phone", label: "Phone", type: "tel", maxLength: 20, autoComplete: "tel", templateSlot: "phone" },
  { name: "address", label: "Business address", type: "textarea", maxLength: 200, autoComplete: "street-address", templateSlot: "address" },
  {
    name: "servingArea", label: "Serving area", type: "text", maxLength: 120,
    placeholder: "e.g. Atlanta & Surrounding States", templateSlot: "servingArea",
  },
  { name: "slug", label: "Web address", type: "slug", maxLength: 50 },
  { name: "templateNumber", label: "Template", type: "template" },
  {
    name: "logo", label: "Logo", type: "image",
    accept: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"], maxBytes: MB5, templateSlot: "logoUrl",
  },
  {
    name: "photo", label: "Your photo", type: "image",
    accept: ["image/png", "image/jpeg", "image/webp"], maxBytes: MB5, templateSlot: "photoUrl",
  },
] as const satisfies readonly FieldDef[];

export type OnboardingFieldName = (typeof ONBOARDING_FIELDS)[number]["name"];
```

- [ ] **Step 2: Write failing tests**

```ts
// src/forms/onboarding.schema.test.ts
import { describe, expect, it } from "vitest";
import { parseOnboarding } from "./onboarding.schema";

const png = () => new File([new Uint8Array([137, 80, 78, 71])], "a.png", { type: "image/png" });

function form(overrides: Record<string, string | File | null> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string | File> = {
    fullName: " Jane Doe ", businessName: "Jane Doe Tax Service", email: "Jane@Example.com",
    phone: "(404) 111-2222", address: "1 Main St, Atlanta, GA",
    servingArea: "Atlanta & Surrounding States", slug: "Jane-Doe-Tax", templateNumber: "1",
    logo: png(), photo: png(),
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v !== null) fd.set(k, v);
  }
  return fd;
}

describe("parseOnboarding", () => {
  it("accepts and normalises valid input", () => {
    const r = parseOnboarding(form());
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toEqual({
      fullName: "Jane Doe", businessName: "Jane Doe Tax Service", email: "jane@example.com",
      phone: "(404) 111-2222", address: "1 Main St, Atlanta, GA",
      servingArea: "Atlanta & Surrounding States", slug: "jane-doe-tax", templateNumber: 1,
    });
    expect(r.logo).toBeInstanceOf(File);
  });

  it("reports per-field errors", () => {
    const r = parseOnboarding(form({ fullName: "", email: "nope", phone: "abc", slug: "a--b", templateNumber: "2" }));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.errors.fullName?.[0]).toMatch(/required/i);
    expect(r.errors.email?.[0]).toMatch(/valid email/i);
    expect(r.errors.phone?.[0]).toMatch(/valid phone/i);
    expect(r.errors.slug?.[0]).toMatch(/lowercase/i);
    expect(r.errors.templateNumber?.[0]).toMatch(/available template/i);
  });

  it("rejects reserved slugs", () => {
    const r = parseOnboarding(form({ slug: "studio" }));
    expect(!r.success && r.errors.slug?.[0]).toMatch(/reserved/i);
  });

  it("validates images: missing, wrong type, too big", () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    const svg = new File(["<svg/>"], "p.svg", { type: "image/svg+xml" });
    const r = parseOnboarding(form({ logo: null, photo: svg }));
    expect(!r.success && r.errors.logo?.[0]).toMatch(/required/i);
    expect(!r.success && r.errors.photo?.[0]).toMatch(/PNG, JPEG or WebP/i);
    const r2 = parseOnboarding(form({ photo: big }));
    expect(!r2.success && r2.errors.photo?.[0]).toMatch(/5 MB/i);
  });
});
```
```ts
// src/forms/contact.schema.test.ts
import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact.schema";

describe("contactSchema", () => {
  it("accepts a valid message and defaults phone", () => {
    const r = contactSchema.safeParse({ name: " Bob ", email: "b@x.com", message: "Hi" });
    expect(r.success && r.data).toEqual({ name: "Bob", email: "b@x.com", phone: "", message: "Hi" });
  });
  it("rejects empty message and bad email", () => {
    const r = contactSchema.safeParse({ name: "Bob", email: "x", message: " " });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/forms` — Expected: FAIL (module not found).

- [ ] **Step 4: Implement schemas**

```ts
// src/forms/onboarding.schema.ts
import { z } from "zod";
import { ONBOARDING_FIELDS, type FieldDef } from "./onboarding.fields";
import { isReservedSlug, isValidSlugFormat, RESERVED_MESSAGE, SLUG_FORMAT_MESSAGE } from "@/lib/slug";
import { isLiveTemplate } from "@/templates/catalog";

export interface OnboardingData {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  servingArea: string;
  slug: string;
  templateNumber: number;
}

export type FieldErrors = Partial<Record<string, string[]>>;

export type OnboardingParseResult =
  | { success: true; data: OnboardingData; logo: File; photo: File }
  | { success: false; errors: FieldErrors };

const PHONE = /^[+()\d\s.-]{7,20}$/;

function required(def: FieldDef) {
  return z.string().trim().min(1, `${def.label} is required`).max(def.maxLength ?? 500, `${def.label} is too long`);
}

function schemaFor(def: FieldDef): z.ZodType {
  switch (def.type) {
    case "text":
    case "textarea":
      return required(def);
    case "email":
      return required(def).toLowerCase().pipe(z.email("Enter a valid email address"));
    case "tel":
      return required(def).regex(PHONE, "Enter a valid phone number");
    case "slug":
      return z
        .string()
        .trim()
        .toLowerCase()
        .refine(isValidSlugFormat, SLUG_FORMAT_MESSAGE)
        .refine((s) => !isReservedSlug(s), RESERVED_MESSAGE);
    case "template":
      return z.coerce.number().int().refine(isLiveTemplate, "Please pick an available template");
    case "image":
      throw new Error("image fields are validated separately");
  }
}

const TEXT_FIELDS = ONBOARDING_FIELDS.filter((f) => f.type !== "image");
const IMAGE_FIELDS = ONBOARDING_FIELDS.filter((f) => f.type === "image");

const textSchema = z.object(Object.fromEntries(TEXT_FIELDS.map((f) => [f.name, schemaFor(f)])));

const TYPE_NAMES: Record<string, string> = {
  "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP", "image/svg+xml": "SVG",
};

function checkImage(def: FieldDef, value: FormDataEntryValue | null): string | null {
  if (!(value instanceof File) || value.size === 0) return `${def.label} is required`;
  const accept = def.accept ?? [];
  if (!accept.includes(value.type)) {
    const names = accept.map((t) => TYPE_NAMES[t] ?? t);
    return `${def.label} must be ${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
  }
  if (value.size > (def.maxBytes ?? Infinity)) return `${def.label} must be 5 MB or smaller`;
  return null;
}

export function parseOnboarding(form: FormData): OnboardingParseResult {
  const raw = Object.fromEntries(TEXT_FIELDS.map((f) => [f.name, String(form.get(f.name) ?? "")]));
  const parsed = textSchema.safeParse(raw);
  const errors: FieldErrors = parsed.success ? {} : { ...z.flattenError(parsed.error).fieldErrors };

  const files: Record<string, File> = {};
  for (const def of IMAGE_FIELDS) {
    const value = form.get(def.name);
    const problem = checkImage(def, value);
    if (problem) errors[def.name] = [problem];
    else files[def.name] = value as File;
  }

  if (!parsed.success || Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: parsed.data as OnboardingData, logo: files.logo, photo: files.photo };
}
```
```ts
// src/forms/contact.schema.ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  phone: z.string().trim().max(30).optional().default(""),
  message: z.string().trim().min(1, "Please enter a message").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run src/forms && npm run typecheck` — Expected: PASS, exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/forms
git commit -m "feat: onboarding field config and validation schemas"
```

---

### Task 6: Rate limiting and Turnstile verification

**Files:**
- Create: `src/lib/rateLimit.ts`, `src/lib/rateLimit.test.ts`, `src/lib/turnstile.ts`, `src/lib/turnstile.test.ts`

**Interfaces:**
- Produces: `rateLimit(key: string, limit: number, windowMs: number, now?: number): boolean` (true = allowed); `clientIp(headers: Headers): string`; `__resetRateLimits(): void`; `verifyTurnstile(token: string, ip?: string): Promise<boolean>`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/rateLimit.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, clientIp, rateLimit } from "./rateLimit";

beforeEach(() => __resetRateLimits());

describe("rateLimit", () => {
  it("allows up to the limit within the window, then blocks", () => {
    expect(rateLimit("k", 2, 1000, 0)).toBe(true);
    expect(rateLimit("k", 2, 1000, 10)).toBe(true);
    expect(rateLimit("k", 2, 1000, 20)).toBe(false);
  });
  it("frees slots once the window passes", () => {
    rateLimit("k", 1, 1000, 0);
    expect(rateLimit("k", 1, 1000, 1001)).toBe(true);
  });
  it("tracks keys separately", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("b", 1, 1000, 0)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses first x-forwarded-for entry, then x-real-ip, else unknown", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
```
```ts
// src/lib/turnstile.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

beforeEach(() => vi.stubEnv("TURNSTILE_SECRET_KEY", "secret"));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("verifyTurnstile", () => {
  it("returns false for an empty token without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyTurnstile("")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("posts secret, token and ip and returns success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyTurnstile("tok", "1.1.1.1")).toBe(true);
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("secret");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("1.1.1.1");
  });
  it("returns false on failure or network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))));
    expect(await verifyTurnstile("tok")).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await verifyTurnstile("tok")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/rateLimit.test.ts src/lib/turnstile.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/rateLimit.ts
/** In-memory sliding window. Per server instance only — swap for Upstash/Vercel KV if abuse appears. */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function __resetRateLimits(): void {
  buckets.clear();
}
```
```ts
// src/lib/turnstile.ts
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!token) return false;
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests** — `npx vitest run src/lib` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rateLimit.ts src/lib/rateLimit.test.ts src/lib/turnstile.ts src/lib/turnstile.test.ts
git commit -m "feat: in-memory rate limiting and Turnstile verification"
```

---

### Task 7: Brevo client and email templates

**Files:**
- Create: `src/lib/brevo.ts`, `src/lib/brevo.test.ts`, `src/lib/emails/escape.ts`, `src/lib/emails/layout.ts`, `src/lib/emails/siteReady.ts`, `src/lib/emails/contactMessage.ts`, `src/lib/emails/emails.test.ts`

**Interfaces:**
- Produces:
  - `interface EmailAddress { email: string; name?: string }`; `interface EmailMessage { to: EmailAddress; subject: string; html: string; text: string; replyTo?: EmailAddress }`; `type SendResult = { ok: true; messageId?: string } | { ok: false; error: string }`; `sendEmail(msg: EmailMessage): Promise<SendResult>`
  - `interface EmailContent { subject: string; html: string; text: string }`
  - `siteReadyEmail(p: { fullName: string; businessName: string; url: string }): EmailContent`
  - `contactMessageEmail(p: { businessName: string; name: string; email: string; phone: string; message: string; pageUrl: string }): EmailContent`
  - `escapeHtml(s: string): string`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/brevo.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./brevo";

const msg = { to: { email: "o@x.com", name: "Owner" }, subject: "S", html: "<p>h</p>", text: "t", replyTo: { email: "v@x.com" } };

beforeEach(() => {
  vi.stubEnv("BREVO_API_KEY", "key");
  vi.stubEnv("BREVO_SENDER_EMAIL", "noreply@affordabiz.com");
  vi.stubEnv("BREVO_SENDER_NAME", "Affordabiz");
  vi.stubEnv("BREVO_DRY_RUN", "");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("sendEmail", () => {
  it("posts the Brevo payload with api-key header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "m1" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(msg)).toEqual({ ok: true, messageId: "m1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.headers["api-key"]).toBe("key");
    expect(JSON.parse(init.body)).toEqual({
      sender: { email: "noreply@affordabiz.com", name: "Affordabiz" },
      to: [{ email: "o@x.com", name: "Owner" }],
      subject: "S", htmlContent: "<p>h</p>", textContent: "t", replyTo: { email: "v@x.com" },
    });
  });
  it("returns ok:false on non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));
    const r = await sendEmail(msg);
    expect(r.ok).toBe(false);
  });
  it("returns ok:false when not configured", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    expect((await sendEmail(msg)).ok).toBe(false);
  });
  it("dry-run never calls fetch", async () => {
    vi.stubEnv("BREVO_DRY_RUN", "1");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await sendEmail(msg)).ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```
```ts
// src/lib/emails/emails.test.ts
import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escape";
import { siteReadyEmail } from "./siteReady";
import { contactMessageEmail } from "./contactMessage";

describe("emails", () => {
  it("escapes html", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
  it("site ready email contains link and business name", () => {
    const e = siteReadyEmail({ fullName: "Jane", businessName: "Jane <Tax>", url: "https://x.com/jane" });
    expect(e.subject).toBe("Your webpage is ready — Jane <Tax>");
    expect(e.html).toContain('href="https://x.com/jane"');
    expect(e.html).toContain("Jane &lt;Tax&gt;");
    expect(e.text).toContain("https://x.com/jane");
  });
  it("contact email escapes visitor input and keeps line breaks", () => {
    const e = contactMessageEmail({
      businessName: "Biz", name: "<b>Bob</b>", email: "b@x.com", phone: "", message: "Line1\nLine2", pageUrl: "https://x.com/biz",
    });
    expect(e.subject).toBe("New enquiry from <b>Bob</b> via your website");
    expect(e.html).toContain("&lt;b&gt;Bob&lt;/b&gt;");
    expect(e.html).toContain("Line1<br>Line2");
    expect(e.text).toContain("Phone: —");
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run src/lib/brevo.test.ts src/lib/emails` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/brevo.ts
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export interface EmailAddress { email: string; name?: string }
export interface EmailMessage {
  to: EmailAddress;
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailAddress;
}
export type SendResult = { ok: true; messageId?: string } | { ok: false; error: string };

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  if (process.env.BREVO_DRY_RUN === "1") {
    console.info("[brevo:dry-run]", msg.to.email, msg.subject);
    return { ok: true, messageId: "dry-run" };
  }
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return { ok: false, error: "Brevo is not configured" };

  try {
    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || "Affordabiz" },
        to: [msg.to],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      }),
    });
    if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
```
```ts
// src/lib/emails/escape.ts
const MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => MAP[c]);
}
```
```ts
// src/lib/emails/layout.ts
import { escapeHtml } from "./escape";

export interface EmailContent { subject: string; html: string; text: string }

/** `bodyHtml` must already be escaped. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#1f2933">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0E5A4E;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">${escapeHtml(title)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#EAF3F0;font-size:12px;color:#52606d">Sent by Affordabiz</td></tr>
</table></td></tr></table></body></html>`;
}
```
```ts
// src/lib/emails/siteReady.ts
import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

export function siteReadyEmail(p: { fullName: string; businessName: string; url: string }): EmailContent {
  const url = escapeHtml(p.url);
  const html = emailLayout(
    "Your webpage is ready",
    `<p>Hi ${escapeHtml(p.fullName)},</p>
<p>Great news — the webpage for <strong>${escapeHtml(p.businessName)}</strong> is live.</p>
<p style="margin:28px 0"><a href="${url}" style="background:#F7931E;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">View your webpage</a></p>
<p>Or copy this link: <a href="${url}" style="color:#0E5A4E">${url}</a></p>
<p>Messages sent through your webpage's contact form will arrive at this email address.</p>`,
  );
  const text = `Hi ${p.fullName},

The webpage for ${p.businessName} is live: ${p.url}

Messages sent through your webpage's contact form will arrive at this email address.`;
  return { subject: `Your webpage is ready — ${p.businessName}`, html, text };
}
```
```ts
// src/lib/emails/contactMessage.ts
import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

export function contactMessageEmail(p: {
  businessName: string; name: string; email: string; phone: string; message: string; pageUrl: string;
}): EmailContent {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#52606d;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0">${value}</td></tr>`;
  const html = emailLayout(
    `New enquiry for ${p.businessName}`,
    `<p>You have a new message from your webpage.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px">
${row("Name", escapeHtml(p.name))}
${row("Email", `<a href="mailto:${escapeHtml(p.email)}" style="color:#0E5A4E">${escapeHtml(p.email)}</a>`)}
${row("Phone", escapeHtml(p.phone || "—"))}
</table>
<p style="margin-top:18px;padding:16px;background:#EAF3F0;border-radius:8px">${escapeHtml(p.message).replace(/\r?\n/g, "<br>")}</p>
<p style="font-size:13px;color:#52606d">Reply to this email to respond directly. Sent from <a href="${escapeHtml(p.pageUrl)}" style="color:#0E5A4E">${escapeHtml(p.pageUrl)}</a></p>`,
  );
  const text = `New enquiry for ${p.businessName}

Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone || "—"}

${p.message}

Sent from ${p.pageUrl}`;
  return { subject: `New enquiry from ${p.name} via your website`, html, text };
}
```

- [ ] **Step 4: Run tests** — `npx vitest run src/lib` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/brevo.ts src/lib/brevo.test.ts src/lib/emails
git commit -m "feat: Brevo email client and email templates"
```

---

### Task 8: Sanity schema, Studio, data access and seed script

**Prerequisite:** Human Prerequisites 1 done and `.env.local` has `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_WRITE_TOKEN`.

**Files:**
- Create: `src/lib/sanity/env.ts`, `src/lib/sanity/client.ts`, `src/lib/sanity/queries.ts`, `src/lib/sanity/write.ts`, `src/sanity/schemaTypes/{index,linkItem,template,site,contactMessage}.ts`, `sanity.config.ts`, `src/app/studio/[[...tool]]/page.tsx`, `scripts/seed-templates.ts`, `src/lib/sanity/queries.test.ts`

**Interfaces:**
- Consumes: `SiteData`, `TemplateCopy` (Task 3); `getDefaultCopy` (Task 4); `mergeCopy`, `withKeys` (Task 3); `OnboardingData` (Task 5)
- Produces:
  - `readClient` (next-sanity client, no token)
  - `getSiteBySlug(slug: string): Promise<SiteData | null>` (cached, tag `site:{slug}`)
  - `getTemplateCopy(n: number): Promise<TemplateCopy | null>` (cached, tag `templates`)
  - `toSiteData(row: SiteRow): SiteData | null`
  - `isSlugTaken(slug: string): Promise<boolean>`
  - `createSite(input: OnboardingData, logo: File, photo: File): Promise<"created" | "conflict">`
  - `logContactMessage(entry: { siteId: string; name: string; email: string; phone: string; message: string; emailStatus: "sent" | "failed" }): Promise<void>`

- [ ] **Step 1: env + clients**

```ts
// src/lib/sanity/env.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2025-10-01";
```
```ts
// src/lib/sanity/client.ts
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Read-only, published content. Caching is handled by "use cache" + cacheTag, so no CDN. */
export const readClient = createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published" });
```

- [ ] **Step 2: Write failing test for `toSiteData`**

```ts
// src/lib/sanity/queries.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("./client", () => ({ readClient: { fetch: vi.fn() } }));
import { toSiteData } from "./queries";

const row = {
  id: "site-jane", slug: "jane", templateNumber: 1, fullName: "Jane", businessName: "Biz",
  email: "j@x.com", phone: "1", address: "A", servingArea: "S",
  logoUrl: "https://cdn.sanity.io/l.png", photoUrl: "https://cdn.sanity.io/p.png",
};

describe("toSiteData", () => {
  it("maps a complete row", () => {
    expect(toSiteData(row)).toEqual(row);
  });
  it("rejects rows with missing images or bad template numbers", () => {
    expect(toSiteData({ ...row, logoUrl: null })).toBeNull();
    expect(toSiteData({ ...row, templateNumber: 9 })).toBeNull();
  });
});
```
Run: `npx vitest run src/lib/sanity/queries.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement queries**

```ts
// src/lib/sanity/queries.ts
import { cacheLife, cacheTag } from "next/cache";
import { defineQuery } from "next-sanity";
import { readClient } from "./client";
import { mergeCopy } from "@/lib/mergeCopy";
import { getDefaultCopy } from "@/templates/defaults";
import type { SiteData, TemplateCopy } from "@/templates/types";

export interface SiteRow {
  id: string;
  slug: string;
  templateNumber: number | null;
  fullName: string | null;
  businessName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  servingArea: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
}

const SITE_QUERY = defineQuery(`*[_type == "site" && slug.current == $slug && published == true][0]{
  "id": _id, "slug": slug.current, templateNumber, fullName, businessName, email, phone, address, servingArea,
  "logoUrl": logo.asset->url, "photoUrl": photo.asset->url
}`);

const TEMPLATE_COPY_QUERY = defineQuery(`*[_type == "template" && number == $n][0].copy`);

export function toSiteData(row: SiteRow): SiteData | null {
  const n = row.templateNumber;
  if (!n || n < 1 || n > 7 || !row.logoUrl || !row.photoUrl) return null;
  return {
    id: row.id,
    slug: row.slug,
    templateNumber: n,
    fullName: row.fullName ?? "",
    businessName: row.businessName ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    servingArea: row.servingArea ?? "",
    logoUrl: row.logoUrl,
    photoUrl: row.photoUrl,
  };
}

export async function getSiteBySlug(slug: string): Promise<SiteData | null> {
  "use cache";
  cacheTag(`site:${slug}`);
  cacheLife("max");
  const row = await readClient.fetch<SiteRow | null>(SITE_QUERY, { slug });
  return row ? toSiteData(row) : null;
}

export async function getTemplateCopy(n: number): Promise<TemplateCopy | null> {
  "use cache";
  cacheTag("templates");
  cacheLife("max");
  const defaults = getDefaultCopy(n);
  if (!defaults) return null;
  const cms = await readClient.fetch<unknown>(TEMPLATE_COPY_QUERY, { n });
  return mergeCopy(defaults, cms);
}
```
Run: `npx vitest run src/lib/sanity/queries.test.ts` — Expected: PASS.

- [ ] **Step 4: Write helpers (server-only)**

```ts
// src/lib/sanity/write.ts
import "server-only";
import { readClient } from "./client";
import type { OnboardingData } from "@/forms/onboarding.schema";

const writeClient = readClient.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  perspective: "raw",
  useCdn: false,
});

export function siteDocId(slug: string): string {
  return `site-${slug}`;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const id = siteDocId(slug);
  const count = await writeClient.fetch<number>(
    `count(*[_type == "site" && (slug.current == $slug || _id in [$id, "drafts." + $id])])`,
    { slug, id },
  );
  return count > 0;
}

async function uploadImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return writeClient.assets.upload("image", buffer, { filename: file.name, contentType: file.type });
}

function isConflict(e: unknown): boolean {
  return typeof e === "object" && e !== null && "statusCode" in e && (e as { statusCode: number }).statusCode === 409;
}

export async function createSite(
  input: OnboardingData,
  logo: File,
  photo: File,
): Promise<"created" | "conflict"> {
  const [logoAsset, photoAsset] = await Promise.all([uploadImage(logo), uploadImage(photo)]);
  try {
    await writeClient.create({
      _id: siteDocId(input.slug),
      _type: "site",
      slug: { _type: "slug", current: input.slug },
      templateNumber: input.templateNumber,
      fullName: input.fullName,
      businessName: input.businessName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      servingArea: input.servingArea,
      logo: { _type: "image", asset: { _type: "reference", _ref: logoAsset._id } },
      photo: { _type: "image", asset: { _type: "reference", _ref: photoAsset._id } },
      published: true,
      createdAt: new Date().toISOString(),
    });
    return "created";
  } catch (e) {
    await Promise.allSettled([writeClient.delete(logoAsset._id), writeClient.delete(photoAsset._id)]);
    if (isConflict(e)) return "conflict";
    throw e;
  }
}

export async function logContactMessage(entry: {
  siteId: string; name: string; email: string; phone: string; message: string; emailStatus: "sent" | "failed";
}): Promise<void> {
  await writeClient.create({
    _type: "contactMessage",
    site: { _type: "reference", _ref: entry.siteId },
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    message: entry.message,
    emailStatus: entry.emailStatus,
    sentAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 5: Schema types**

```ts
// src/sanity/schemaTypes/linkItem.ts
import { defineField, defineType } from "sanity";

export const linkItem = defineType({
  name: "linkItem",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "url", title: "URL", type: "string", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "label", subtitle: "url" } },
});
```
```ts
// src/sanity/schemaTypes/template.ts
import { defineField, defineType } from "sanity";

const str = (name: string, title?: string) => defineField({ name, title, type: "string" });
const txt = (name: string, title?: string, description?: string) =>
  defineField({ name, title, type: "text", rows: 4, description });
const strings = (name: string, title?: string) => defineField({ name, title, type: "array", of: [{ type: "string" }] });
const links = (name: string, title?: string) => defineField({ name, title, type: "array", of: [{ type: "linkItem" }] });

const TOKENS = "Tokens: {{fullName}} {{businessName}} {{email}} {{phone}} {{address}} {{servingArea}}";
const RICH = "Supports **bold**, [label](https://link) and lines starting with '- ' for bullets.";

export const template = defineType({
  name: "template",
  title: "Template",
  type: "document",
  fields: [
    defineField({ name: "number", type: "number", validation: (r) => r.required().integer().min(1).max(7) }),
    defineField({ name: "name", type: "string" }),
    defineField({
      name: "copy",
      title: "Fixed text",
      description: `Empty fields fall back to the built-in text. ${TOKENS}`,
      type: "object",
      options: { collapsible: true },
      fields: [
        links("nav", "Navigation"),
        links("headerButtons", "Header buttons"),
        defineField({
          name: "hero", type: "object",
          fields: [str("eyebrow"), str("title"), str("subtitle"), str("servingLine"), str("availability"),
            str("ctaLabel"), str("badge"), str("contactLabel"), strings("notes", "Sticky notes")],
        }),
        strings("highlights"),
        defineField({
          name: "intro", type: "object",
          fields: [str("heading"), defineField({
            name: "cards", type: "array",
            of: [{ type: "object", name: "introCard", fields: [txt("body")] }],
          })],
        }),
        defineField({
          name: "services", type: "object",
          fields: [str("heading"), str("ctaLabel"), defineField({
            name: "items", type: "array",
            of: [{ type: "object", name: "serviceItem", fields: [str("title"), txt("body")] }],
          })],
        }),
        defineField({
          name: "faq", title: "FAQ", type: "object",
          fields: [str("heading"), defineField({
            name: "items", type: "array",
            of: [{ type: "object", name: "faqItem", fields: [str("question"), txt("answer", "Answer", RICH)],
              preview: { select: { title: "question" } } }],
          })],
        }),
        defineField({
          name: "forms", title: "Client forms", type: "object",
          fields: [str("heading"), defineField({
            name: "groups", type: "array",
            of: [{ type: "object", name: "formGroup", fields: [str("heading"), links("links")],
              preview: { select: { title: "heading" } } }],
          }), defineField({ name: "portalLink", type: "linkItem" })],
        }),
        defineField({
          name: "loans", title: "Cash advance / loans", type: "object",
          fields: [strings("promoLines"), str("promoBadge"), str("partnerLogoUrl", "Partner logo URL"),
            str("partnerName"),
            defineField({
              name: "cards", type: "array",
              of: [{ type: "object", name: "loanCard", fields: [str("title"), str("detail")] }],
            }),
            defineField({ name: "disclaimers", type: "array", of: [{ type: "text" }],
              description: "Numbered footnotes shown under the loan cards. Paste the exact legal text." })],
        }),
        defineField({ name: "cta", title: "Call to action", type: "object", fields: [str("heading"), str("buttonLabel")] }),
        defineField({ name: "contact", type: "object", fields: [str("heading"), str("intro"), str("credentialLine")] }),
        defineField({ name: "footer", type: "object", fields: [txt("text"), links("links")] }),
      ],
    }),
  ],
  preview: {
    select: { number: "number", name: "name" },
    prepare: ({ number, name }) => ({ title: `Template ${number}`, subtitle: name }),
  },
});
```
```ts
// src/sanity/schemaTypes/site.ts
import { defineField, defineType } from "sanity";

export const site = defineType({
  name: "site",
  title: "Site",
  type: "document",
  fields: [
    defineField({ name: "businessName", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "businessName", maxLength: 50 }, validation: (r) => r.required() }),
    defineField({ name: "published", type: "boolean", initialValue: true, description: "Turn off to take the page offline." }),
    defineField({ name: "templateNumber", type: "number", validation: (r) => r.required().integer().min(1).max(7) }),
    defineField({ name: "fullName", type: "string", validation: (r) => r.required() }),
    defineField({ name: "email", type: "string", validation: (r) => r.required().email() }),
    defineField({ name: "phone", type: "string", validation: (r) => r.required() }),
    defineField({ name: "address", type: "text", rows: 2, validation: (r) => r.required() }),
    defineField({ name: "servingArea", type: "string", validation: (r) => r.required() }),
    defineField({ name: "logo", type: "image", validation: (r) => r.required() }),
    defineField({ name: "photo", type: "image", validation: (r) => r.required() }),
    defineField({ name: "createdAt", type: "datetime", readOnly: true }),
  ],
  preview: { select: { title: "businessName", subtitle: "slug.current", media: "logo" } },
});
```
```ts
// src/sanity/schemaTypes/contactMessage.ts
import { defineField, defineType } from "sanity";

export const contactMessage = defineType({
  name: "contactMessage",
  title: "Contact message",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "site", type: "reference", to: [{ type: "site" }] }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({ name: "message", type: "text" }),
    defineField({ name: "emailStatus", type: "string", options: { list: ["sent", "failed"] } }),
    defineField({ name: "sentAt", type: "datetime" }),
  ],
  orderings: [{ title: "Newest", name: "sentAtDesc", by: [{ field: "sentAt", direction: "desc" }] }],
  preview: { select: { title: "name", subtitle: "email" } },
});
```
```ts
// src/sanity/schemaTypes/index.ts
import { contactMessage } from "./contactMessage";
import { linkItem } from "./linkItem";
import { site } from "./site";
import { template } from "./template";

export const schemaTypes = [site, template, contactMessage, linkItem];
```

- [ ] **Step 6: Studio config and route**

```ts
// sanity.config.ts
"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/lib/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "default",
  title: "Affordabiz",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
  document: { comments: { enabled: false } },
  apiVersion,
});
```
If `apiVersion` is rejected as an unknown key by `defineConfig` typing, remove that line.
```tsx
// src/app/studio/[[...tool]]/page.tsx
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

- [ ] **Step 7: Seed script**

```ts
// scripts/seed-templates.ts
import { createClient } from "next-sanity";
import { TEMPLATE_CATALOG } from "../src/templates/catalog";
import { getDefaultCopy } from "../src/templates/defaults";
import { withKeys } from "../src/lib/sanity/withKeys";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function main() {
  const tx = client.transaction();
  for (const t of TEMPLATE_CATALOG) {
    const copy = getDefaultCopy(t.number);
    tx.createOrReplace({
      _id: `template-${t.number}`,
      _type: "template",
      number: t.number,
      name: t.name,
      ...(copy ? { copy: withKeys(copy) } : {}),
    });
  }
  const res = await tx.commit();
  console.log(`Seeded ${res.results.length} template documents into "${client.config().dataset}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```
Note: `createOrReplace` overwrites admin edits to template copy. Only run it on first setup or intentionally.

- [ ] **Step 8: Verify**

Run: `npm test && npm run typecheck && npm run seed`
Expected: tests PASS; tsc exit 0; seed prints `Seeded 7 template documents into "production".`
Then `npm run dev`, open `http://localhost:3000/studio`, log in → "Site", "Template", "Contact message" visible; Template 1 shows the seeded text. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add sanity.config.ts scripts src/lib/sanity src/sanity src/app/studio
git commit -m "feat: Sanity schema, embedded Studio, data access and template seed"
```

---

### Task 9: Slug availability API

**Files:**
- Create: `src/lib/slugCheck.ts`, `src/app/api/slug-available/route.ts`, `src/app/api/slug-available/route.test.ts`

**Interfaces:**
- Consumes: slug utils (Task 2); `isSlugTaken` (Task 8); `rateLimit`, `clientIp` (Task 6)
- Produces: `checkSlug(rawSlug: string): Promise<SlugCheckResponse>`; `GET /api/slug-available?slug=` → `SlugCheckResponse` JSON (200) or `{ error }` (429)

- [ ] **Step 1: Write failing route test**

```ts
// src/app/api/slug-available/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const isSlugTaken = vi.fn();
vi.mock("@/lib/sanity/write", () => ({ isSlugTaken: (s: string) => isSlugTaken(s) }));

import { GET } from "./route";
import { __resetRateLimits } from "@/lib/rateLimit";

const call = (slug: string) =>
  GET(new Request(`http://localhost/api/slug-available?slug=${encodeURIComponent(slug)}`, {
    headers: { "x-forwarded-for": "9.9.9.9" },
  }));

beforeEach(() => {
  __resetRateLimits();
  isSlugTaken.mockReset();
});

describe("GET /api/slug-available", () => {
  it("reports available", async () => {
    isSlugTaken.mockResolvedValue(false);
    expect(await (await call("Jane-Doe")).json()).toEqual({ available: true });
    expect(isSlugTaken).toHaveBeenCalledWith("jane-doe");
  });
  it("reports taken with a suggestion", async () => {
    isSlugTaken.mockImplementation(async (s: string) => s === "jane");
    expect(await (await call("jane")).json()).toEqual({
      available: false, reason: "taken",
      message: "This address is already taken — please choose a different one.", suggestion: "jane-2",
    });
  });
  it("reports invalid and reserved without hitting Sanity", async () => {
    expect((await (await call("a")).json()).reason).toBe("invalid");
    expect((await (await call("studio")).json()).reason).toBe("reserved");
    expect(isSlugTaken).not.toHaveBeenCalled();
  });
  it("rate limits", async () => {
    isSlugTaken.mockResolvedValue(false);
    for (let i = 0; i < 60; i++) await call("jane");
    expect((await call("jane")).status).toBe(429);
  });
});
```
Run: `npx vitest run src/app/api/slug-available` — Expected: FAIL (module not found).

- [ ] **Step 2: Implement**

```ts
// src/lib/slugCheck.ts
import "server-only";
import {
  isReservedSlug, isValidSlugFormat, RESERVED_MESSAGE, SLUG_FORMAT_MESSAGE, suggestSlug, TAKEN_MESSAGE,
  type SlugCheckResponse,
} from "@/lib/slug";
import { isSlugTaken } from "@/lib/sanity/write";

export async function checkSlug(rawSlug: string): Promise<SlugCheckResponse> {
  const slug = rawSlug.trim().toLowerCase();
  if (!isValidSlugFormat(slug)) return { available: false, reason: "invalid", message: SLUG_FORMAT_MESSAGE };
  if (isReservedSlug(slug)) return { available: false, reason: "reserved", message: RESERVED_MESSAGE };
  if (!(await isSlugTaken(slug))) return { available: true };
  const suggestion = await suggestSlug(slug, isSlugTaken);
  return { available: false, reason: "taken", message: TAKEN_MESSAGE, ...(suggestion ? { suggestion } : {}) };
}
```
```ts
// src/app/api/slug-available/route.ts
import { NextResponse } from "next/server";
import { checkSlug } from "@/lib/slugCheck";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  if (!rateLimit(`slug:${clientIp(req.headers)}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  return NextResponse.json(await checkSlug(slug), { headers: { "cache-control": "no-store" } });
}
```

- [ ] **Step 3: Run tests** — `npx vitest run src/app/api/slug-available` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/slugCheck.ts src/app/api/slug-available
git commit -m "feat: live slug availability endpoint"
```

---

### Task 10: Site creation API

**Files:**
- Create: `src/app/api/sites/route.ts`, `src/app/api/sites/route.test.ts`

**Interfaces:**
- Consumes: `parseOnboarding` (Task 5); `verifyTurnstile`, `rateLimit`, `clientIp` (Task 6); `sendEmail`, `siteReadyEmail` (Task 7); `createSite` (Task 8); `checkSlug` (Task 9); `siteUrl` (Task 1)
- Produces: `POST /api/sites` (multipart). Responses:
  - `201 { url: string }`
  - `400 { errors: FieldErrors }`
  - `403 { error: string }` (honeypot field `company_website` filled, or Turnstile failed)
  - `409 { errors: { slug: [TAKEN_MESSAGE] }, suggestion?: string }`
  - `429 { error }`, `500 { error }`
- Turnstile token form field: `cf-turnstile-response`.

- [ ] **Step 1: Write failing tests**

```ts
// src/app/api/sites/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyTurnstile: vi.fn(), checkSlug: vi.fn(), createSite: vi.fn(), sendEmail: vi.fn(), revalidateTag: vi.fn(),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/slugCheck", () => ({ checkSlug: mocks.checkSlug }));
vi.mock("@/lib/sanity/write", () => ({ createSite: mocks.createSite }));
vi.mock("@/lib/brevo", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import { POST } from "./route";
import { __resetRateLimits } from "@/lib/rateLimit";

const png = () => new File([new Uint8Array([137, 80, 78, 71])], "a.png", { type: "image/png" });

function request(overrides: Record<string, string | null> = {}) {
  const fd = new FormData();
  const base: Record<string, string> = {
    fullName: "Jane Doe", businessName: "Jane Doe Tax Service", email: "jane@example.com",
    phone: "(404) 111-2222", address: "1 Main St", servingArea: "Atlanta", slug: "jane-doe-tax",
    templateNumber: "1", "cf-turnstile-response": "tok",
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) if (v !== null) fd.set(k, v);
  fd.set("logo", png());
  fd.set("photo", png());
  return new Request("http://localhost/api/sites", { method: "POST", body: fd, headers: { "x-forwarded-for": "1.2.3.4" } });
}

beforeEach(() => {
  __resetRateLimits();
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.verifyTurnstile.mockResolvedValue(true);
  mocks.checkSlug.mockResolvedValue({ available: true });
  mocks.createSite.mockResolvedValue("created");
  mocks.sendEmail.mockResolvedValue({ ok: true });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://affordabiz.test");
});

describe("POST /api/sites", () => {
  it("creates the site, clears the cached 404 and emails the owner", async () => {
    const res = await POST(request());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ url: "https://affordabiz.test/jane-doe-tax" });
    expect(mocks.createSite).toHaveBeenCalledWith(expect.objectContaining({ slug: "jane-doe-tax", templateNumber: 1 }), expect.any(File), expect.any(File));
    expect(mocks.revalidateTag).toHaveBeenCalledWith("site:jane-doe-tax", { expire: 0 });
    const email = mocks.sendEmail.mock.calls[0][0];
    expect(email.to).toEqual({ email: "jane@example.com", name: "Jane Doe" });
    expect(email.html).toContain("https://affordabiz.test/jane-doe-tax");
  });

  it("still succeeds when the email fails", async () => {
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "boom" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(201);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("400 with field errors on invalid input", async () => {
    const res = await POST(request({ email: "bad" }));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.email).toBeDefined();
    expect(mocks.createSite).not.toHaveBeenCalled();
  });

  it("403 when Turnstile fails or honeypot is filled", async () => {
    mocks.verifyTurnstile.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(403);
    mocks.verifyTurnstile.mockResolvedValue(true);
    expect((await POST(request({ company_website: "spam" }))).status).toBe(403);
  });

  it("409 with suggestion when the slug is taken", async () => {
    mocks.checkSlug.mockResolvedValue({ available: false, reason: "taken", message: "taken", suggestion: "jane-doe-tax-2" });
    const res = await POST(request());
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      errors: { slug: ["This address is already taken — please choose a different one."] }, suggestion: "jane-doe-tax-2",
    });
  });

  it("409 when the create races with another submission", async () => {
    mocks.createSite.mockResolvedValue("conflict");
    expect((await POST(request())).status).toBe(409);
  });

  it("500 when Sanity fails", async () => {
    mocks.createSite.mockRejectedValue(new Error("sanity down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(500);
    spy.mockRestore();
  });

  it("429 after 5 submissions per hour", async () => {
    for (let i = 0; i < 5; i++) await POST(request());
    expect((await POST(request())).status).toBe(429);
  });
});
```
Run: `npx vitest run src/app/api/sites` — Expected: FAIL.

- [ ] **Step 2: Implement**

```ts
// src/app/api/sites/route.ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { parseOnboarding } from "@/forms/onboarding.schema";
import { sendEmail } from "@/lib/brevo";
import { siteReadyEmail } from "@/lib/emails/siteReady";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { createSite } from "@/lib/sanity/write";
import { TAKEN_MESSAGE } from "@/lib/slug";
import { checkSlug } from "@/lib/slugCheck";
import { siteUrl } from "@/lib/siteUrl";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`sites:${ip}`, 5, 60 * 60 * 1000)) {
    return json({ error: "Too many submissions. Please try again later." }, 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Invalid form submission." }, 400);
  }

  if (String(form.get("company_website") ?? "") !== "") return json({ error: "Submission rejected." }, 403);
  if (!(await verifyTurnstile(String(form.get("cf-turnstile-response") ?? ""), ip))) {
    return json({ error: "Please complete the security check and try again." }, 403);
  }

  const parsed = parseOnboarding(form);
  if (!parsed.success) return json({ errors: parsed.errors }, 400);
  const { data, logo, photo } = parsed;

  try {
    const slugStatus = await checkSlug(data.slug);
    if (!slugStatus.available) {
      if (slugStatus.reason !== "taken") return json({ errors: { slug: [slugStatus.message] } }, 400);
      return json({ errors: { slug: [TAKEN_MESSAGE] }, ...(slugStatus.suggestion ? { suggestion: slugStatus.suggestion } : {}) }, 409);
    }

    const result = await createSite(data, logo, photo);
    if (result === "conflict") return json({ errors: { slug: [TAKEN_MESSAGE] } }, 409);
  } catch (e) {
    console.error("[sites] create failed", e);
    return json({ error: "We couldn't create your webpage. Please try again." }, 500);
  }

  revalidateTag(`site:${data.slug}`, { expire: 0 });
  const url = siteUrl(data.slug);

  const email = await sendEmail({
    to: { email: data.email, name: data.fullName },
    ...siteReadyEmail({ fullName: data.fullName, businessName: data.businessName, url }),
  });
  if (!email.ok) console.error("[sites] site-ready email failed", data.slug, email.error);

  return json({ url }, 201);
}
```

- [ ] **Step 3: Run tests** — `npx vitest run src/app/api/sites` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sites
git commit -m "feat: site creation endpoint with Sanity write and Brevo notification"
```

---

### Task 11: Contact form API

**Files:**
- Create: `src/app/api/contact/[slug]/route.ts`, `src/app/api/contact/[slug]/route.test.ts`

**Interfaces:**
- Consumes: `contactSchema` (Task 5); `getSiteBySlug` (Task 8); `logContactMessage` (Task 8); `sendEmail`, `contactMessageEmail` (Task 7); `verifyTurnstile`, `rateLimit`, `clientIp` (Task 6); `siteUrl` (Task 1)
- Produces: `POST /api/contact/[slug]` JSON body `{ name, email, phone?, message, turnstileToken, website }` (`website` = honeypot). Responses: `200 { ok: true }`, `400 { errors }`, `403`, `404`, `429`, `502 { error }`.

- [ ] **Step 1: Write failing tests**

```ts
// src/app/api/contact/[slug]/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyTurnstile: vi.fn(), getSiteBySlug: vi.fn(), logContactMessage: vi.fn(), sendEmail: vi.fn(),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/sanity/queries", () => ({ getSiteBySlug: mocks.getSiteBySlug }));
vi.mock("@/lib/sanity/write", () => ({ logContactMessage: mocks.logContactMessage }));
vi.mock("@/lib/brevo", () => ({ sendEmail: mocks.sendEmail }));

import { POST } from "./route";
import { __resetRateLimits } from "@/lib/rateLimit";

const site = {
  id: "site-jane", slug: "jane", templateNumber: 1, fullName: "Jane Doe", businessName: "Jane Doe Tax",
  email: "owner@example.com", phone: "1", address: "A", servingArea: "S", logoUrl: "l", photoUrl: "p",
};

function call(body: Record<string, unknown>, slug = "jane") {
  const req = new Request(`http://localhost/api/contact/${slug}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "5.5.5.5" },
    body: JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({ slug }) });
}

const valid = { name: "Bob", email: "bob@example.com", phone: "", message: "Hello", turnstileToken: "tok", website: "" };

beforeEach(() => {
  __resetRateLimits();
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.verifyTurnstile.mockResolvedValue(true);
  mocks.getSiteBySlug.mockResolvedValue(site);
  mocks.sendEmail.mockResolvedValue({ ok: true });
  mocks.logContactMessage.mockResolvedValue(undefined);
});

describe("POST /api/contact/[slug]", () => {
  it("emails the owner with reply-to the visitor and logs the message", async () => {
    const res = await call(valid);
    expect(res.status).toBe(200);
    const msg = mocks.sendEmail.mock.calls[0][0];
    expect(msg.to).toEqual({ email: "owner@example.com", name: "Jane Doe" });
    expect(msg.replyTo).toEqual({ email: "bob@example.com", name: "Bob" });
    expect(msg.subject).toBe("New enquiry from Bob via your website");
    expect(mocks.logContactMessage).toHaveBeenCalledWith(expect.objectContaining({ siteId: "site-jane", emailStatus: "sent" }));
  });
  it("404 for unknown site", async () => {
    mocks.getSiteBySlug.mockResolvedValue(null);
    expect((await call(valid, "nobody")).status).toBe(404);
  });
  it("400 for invalid input", async () => {
    expect((await call({ ...valid, email: "x" })).status).toBe(400);
  });
  it("403 for failed Turnstile or honeypot", async () => {
    expect((await call({ ...valid, website: "spam" })).status).toBe(403);
    mocks.verifyTurnstile.mockResolvedValue(false);
    expect((await call(valid)).status).toBe(403);
  });
  it("502 when Brevo fails, still logged as failed", async () => {
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "x" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await call(valid)).status).toBe(502);
    expect(mocks.logContactMessage).toHaveBeenCalledWith(expect.objectContaining({ emailStatus: "failed" }));
    spy.mockRestore();
  });
});
```
Run: `npx vitest run src/app/api/contact` — Expected: FAIL.

- [ ] **Step 2: Implement**

```ts
// src/app/api/contact/[slug]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/forms/contact.schema";
import { sendEmail } from "@/lib/brevo";
import { contactMessageEmail } from "@/lib/emails/contactMessage";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getSiteBySlug } from "@/lib/sanity/queries";
import { logContactMessage } from "@/lib/sanity/write";
import { siteUrl } from "@/lib/siteUrl";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const ip = clientIp(req.headers);
  if (!rateLimit(`contact:${ip}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many messages. Please try again later." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (typeof body.website === "string" && body.website !== "") return json({ error: "Message rejected." }, 403);
  if (!(await verifyTurnstile(typeof body.turnstileToken === "string" ? body.turnstileToken : "", ip))) {
    return json({ error: "Please complete the security check and try again." }, 403);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return json({ errors: z.flattenError(parsed.error).fieldErrors }, 400);

  const site = await getSiteBySlug(slug);
  if (!site || !site.id) return json({ error: "Page not found." }, 404);

  const msg = parsed.data;
  const result = await sendEmail({
    to: { email: site.email, name: site.fullName },
    replyTo: { email: msg.email, name: msg.name },
    ...contactMessageEmail({ businessName: site.businessName, ...msg, pageUrl: siteUrl(slug) }),
  });

  try {
    await logContactMessage({ siteId: site.id, ...msg, emailStatus: result.ok ? "sent" : "failed" });
  } catch (e) {
    console.error("[contact] log failed", e);
  }

  if (!result.ok) {
    console.error("[contact] email failed", slug, result.error);
    return json({ error: "Sorry, your message couldn't be sent. Please call or email instead." }, 502);
  }
  return json({ ok: true }, 200);
}
```

- [ ] **Step 3: Run tests** — `npx vitest run src/app/api/contact` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/contact
git commit -m "feat: per-site contact form endpoint emailing the owner"
```

---

### Task 12: Template 1 components and registry

**Files:**
- Create: `src/templates/RichText.tsx`, `src/templates/registry.tsx`, `src/templates/t1/theme.ts`, `src/templates/t1/index.tsx`, `src/templates/t1/Header.tsx`, `Hero.tsx`, `Intro.tsx`, `Services.tsx`, `Faq.tsx`, `ClientForms.tsx`, `Loans.tsx`, `Cta.tsx`, `Contact.tsx`, `ContactForm.tsx`, `Footer.tsx`

**Interfaces:**
- Consumes: `TemplateProps`, `SiteData`, `TemplateCopy` (Task 3); `parseRichText` (Task 3); `POST /api/contact/[slug]` contract (Task 11)
- Produces: `getTemplateComponent(n: number): ComponentType<TemplateProps> | null`; default export `TemplateOne`

Design direction: modern and editorial. Serif italic display headings (Playfair Display) with a clean sans body (Plus Jakarta Sans), generous whitespace, rounded cards, a teal/orange palette, a sticky translucent header, and an accessible FAQ built on `<details>`. All text comes from `copy`/`site`, so no hard-coded copy goes in components.

- [ ] **Step 1: Theme + RichText**

```ts
// src/templates/t1/theme.ts
import type { CSSProperties } from "react";

export const T1_THEME = {
  "--t1-teal": "#0E5A4E",
  "--t1-teal-deep": "#0A453C",
  "--t1-orange": "#F7931E",
  "--t1-orange-deep": "#E07B00",
  "--t1-mint": "#EAF3F0",
  "--t1-crimson": "#B5223D",
} as CSSProperties;

export const display = "font-(family-name:--t1-font-display)";
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-(--t1-orange) px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-(--t1-orange-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--t1-orange)";
export const btnOutlineLight =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10";
export const btnTeal =
  "inline-flex items-center justify-center gap-2 rounded-full bg-(--t1-teal) px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-(--t1-teal-deep)";

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
```
```tsx
// src/templates/RichText.tsx
import { parseRichText, type Inline } from "@/lib/richText";

function renderInline(parts: Inline[]) {
  return parts.map((p, i) => {
    if (p.type === "bold") return <strong key={i}>{p.value}</strong>;
    if (p.type === "link") {
      const external = /^https?:\/\//i.test(p.href);
      return (
        <a key={i} href={p.href} className="font-medium underline underline-offset-2"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {p.label}
        </a>
      );
    }
    return <span key={i}>{p.value}</span>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return null;
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>{renderInline(b.content)}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
          </ul>
        ),
      )}
    </div>
  );
}
```

- [ ] **Step 2: Header + Hero**

```tsx
// src/templates/t1/Header.tsx
import Image from "next/image";
import { Menu } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnPrimary, container, isExternal } from "./theme";

export function Header({ site, copy }: TemplateProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-(--t1-teal-deep)/95 text-white backdrop-blur">
      <div className={`${container} flex items-center gap-6 py-3`}>
        <a href="#home" className="shrink-0">
          <Image unoptimized src={site.logoUrl} alt={`${site.businessName} logo`} width={180} height={56}
            className="h-12 w-auto rounded-md bg-white object-contain p-1" />
        </a>
        <nav aria-label="Primary" className="hidden flex-1 justify-center gap-7 text-sm font-medium lg:flex">
          {copy.nav.map((l) => (
            <a key={l.url} href={l.url} className="text-white/80 transition hover:text-(--t1-orange)">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden gap-2 sm:flex">
          {copy.headerButtons.map((b, i) => (
            <a key={b.url} href={b.url}
              {...(isExternal(b.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={i === 0 ? "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/40 hover:bg-white/10" : `${btnPrimary} px-4! py-2! text-xs!`}>
              {b.label}
            </a>
          ))}
        </div>
        <details className="relative ml-auto lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-2 ring-1 ring-white/30">
            <Menu className="size-5" aria-hidden /> <span className="text-sm">Menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 text-slate-800 shadow-xl">
            {[...copy.nav, ...copy.headerButtons].map((l) => (
              <a key={l.url + l.label} href={l.url} className="block rounded-lg px-3 py-2 text-sm hover:bg-(--t1-mint)">{l.label}</a>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
```
```tsx
// src/templates/t1/Hero.tsx
import { BadgeCheck, Check, Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnOutlineLight, btnPrimary, container, display, telHref } from "./theme";

const TILT = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];

export function Hero({ site, copy }: TemplateProps) {
  const { hero, highlights } = copy;
  return (
    <section id="home" className="relative overflow-hidden bg-(--t1-teal) text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-(--t1-orange)/15 blur-3xl" />
      <div className={`${container} relative grid gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-28`}>
        <div className="flex flex-col justify-center">
          <p className={`${display} text-2xl italic text-(--t1-orange)`}>{hero.eyebrow}</p>
          <h1 className={`${display} mt-4 text-5xl font-semibold italic leading-[1.05] sm:text-6xl lg:text-7xl`}>{hero.title}</h1>
          <p className="mt-6 text-lg font-medium text-white/90">{hero.subtitle}</p>
          <p className="mt-3 text-white/75">{hero.servingLine}<br />{hero.availability}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#about" className={btnPrimary}>{hero.ctaLabel}</a>
            <a href={telHref(site.phone)} className={btnOutlineLight}><Phone className="size-4" aria-hidden />{site.phone}</a>
          </div>
        </div>

        <aside className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/15 backdrop-blur sm:p-8">
          <div className="flex flex-wrap gap-2" aria-hidden>
            {hero.notes.map((n, i) => (
              <span key={n} className={`${TILT[i % TILT.length]} rounded-md bg-(--t1-orange) px-3 py-1.5 text-sm font-bold text-(--t1-teal-deep) shadow`}>{n}</span>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-(--t1-orange)">
            <BadgeCheck className="size-5" aria-hidden />{hero.badge}
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/90">
            {highlights.map((h) => (
              <li key={h} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-(--t1-orange)" aria-hidden />{h}</li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 rounded-2xl bg-(--t1-teal-deep) p-5 text-sm">
            <p className="font-semibold uppercase tracking-wider text-white/60">{hero.contactLabel}</p>
            <a href={telHref(site.phone)} className="flex items-center gap-2 hover:text-(--t1-orange)"><Phone className="size-4" aria-hidden />{site.phone}</a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 break-all hover:text-(--t1-orange)"><Mail className="size-4 shrink-0" aria-hidden />{site.email}</a>
            <p className="flex items-start gap-2 text-white/80"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{site.address}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Intro + Services + FAQ**

```tsx
// src/templates/t1/Intro.tsx
import Image from "next/image";
import { CircleDollarSign, FileText, TriangleAlert } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

const ICONS = [FileText, TriangleAlert, CircleDollarSign];

export function Intro({ site, copy }: TemplateProps) {
  return (
    <section id="about" className="bg-white py-20 lg:py-28">
      <div className={`${container} grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div className="relative mx-auto w-full max-w-sm">
          <div aria-hidden className="absolute -bottom-4 -right-4 size-full rounded-3xl bg-(--t1-orange)" />
          <div className="relative aspect-[5/6] overflow-hidden rounded-3xl bg-(--t1-mint) shadow-xl">
            <Image unoptimized fill src={site.photoUrl} alt={site.fullName} className="object-cover" sizes="(min-width: 1024px) 24rem, 90vw" />
          </div>
        </div>
        <div>
          <h2 className={`${display} text-3xl font-semibold text-(--t1-teal) sm:text-4xl`}>{copy.intro.heading}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {copy.intro.cards.map((card, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article key={i} className="rounded-2xl bg-(--t1-mint) p-6">
                  <span className="grid size-12 place-items-center rounded-xl bg-(--t1-orange)/15 text-(--t1-orange)"><Icon className="size-6" aria-hidden /></span>
                  <p className="mt-4 text-sm leading-relaxed text-slate-700">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```
```tsx
// src/templates/t1/Services.tsx
import { ClipboardList, FileClock, FilePen } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnPrimary, container, display } from "./theme";

const ICONS = [ClipboardList, FilePen, FileClock];

export function Services({ copy }: TemplateProps) {
  return (
    <section id="services" className="bg-(--t1-mint) py-20 lg:py-28">
      <div className={container}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className={`${display} text-4xl font-semibold text-(--t1-teal) sm:text-5xl`}>{copy.services.heading}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{copy.highlights.join(" | ")}</p>
          </div>
          <a href="#contact" className={btnPrimary}>{copy.services.ctaLabel}</a>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.services.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article key={item.title} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg">
                <Icon className="size-9 text-(--t1-teal)" aria-hidden />
                <h3 className={`${display} mt-5 text-2xl font-semibold text-(--t1-teal)`}>{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```
```tsx
// src/templates/t1/Faq.tsx
import { ChevronDown } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className="bg-white py-20 lg:py-28">
      <div className={`${container} grid gap-10 lg:grid-cols-[0.6fr_1.4fr]`}>
        <h2 className={`${display} text-4xl font-semibold text-(--t1-teal) sm:text-5xl`}>{copy.faq.heading}</h2>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {items.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-(--t1-teal-deep)">
                {item.question}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--t1-orange) text-white transition group-open:rotate-180">
                  <ChevronDown className="size-4" aria-hidden />
                </span>
              </summary>
              <RichText text={item.answer} className="mt-4 text-sm leading-relaxed text-slate-600" />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Client forms, loans, CTA, footer**

```tsx
// src/templates/t1/ClientForms.tsx
import { ClipboardCheck, FilePen, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnPrimary, btnTeal, container, display, isExternal } from "./theme";

const ICONS = [ClipboardCheck, FilePen];
const ext = (url: string) => (isExternal(url) ? { target: "_blank", rel: "noopener noreferrer" } : {});

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className="bg-(--t1-mint) py-20 lg:py-28">
      <div className={container}>
        <h2 className={`${display} text-center text-4xl font-semibold text-(--t1-teal) sm:text-5xl`}>{forms.heading}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {forms.groups.map((g, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article key={g.heading} className="flex flex-col items-center rounded-3xl bg-white p-8 text-center shadow-sm">
                <Icon className="size-10 text-(--t1-teal)" aria-hidden />
                <h3 className={`${display} mt-4 max-w-sm text-xl font-semibold text-(--t1-teal)`}>{g.heading}</h3>
                <div className="mt-6 flex w-full flex-col gap-3">
                  {g.links.map((l) => <a key={l.label} href={l.url} {...ext(l.url)} className={btnPrimary}>{l.label}</a>)}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-6 flex justify-center">
          <a href={forms.portalLink.url} {...ext(forms.portalLink.url)} className={`${btnTeal} w-full max-w-xl py-4!`}>
            <Upload className="size-4" aria-hidden />{forms.portalLink.label}
          </a>
        </div>
      </div>
    </section>
  );
}
```
```tsx
// src/templates/t1/Loans.tsx
import Image from "next/image";
import { CircleDollarSign, Percent } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

const ICONS = [CircleDollarSign, Percent];

export function Loans({ copy }: TemplateProps) {
  const { loans } = copy;
  return (
    <section id="cash-advance" className="relative bg-(--t1-teal) py-20 text-white lg:py-28">
      <div className={`${container} grid gap-10 lg:grid-cols-[0.75fr_1.25fr]`}>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-(--t1-orange) p-10 text-center shadow-xl">
          {loans.promoLines.map((line) => (
            <p key={line} className={`${display} text-4xl font-bold uppercase leading-tight`}>{line}</p>
          ))}
          <p className="mt-8 grid size-44 place-items-center rounded-full bg-(--t1-teal) p-6 text-lg font-bold uppercase leading-snug">{loans.promoBadge}</p>
        </div>
        <div>
          <div className="mx-auto w-fit rounded-2xl bg-white px-6 py-4">
            <Image unoptimized src={loans.partnerLogoUrl} alt={loans.partnerName} width={320} height={90} className="h-16 w-auto object-contain" />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {loans.cards.map((c, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article key={c.title} className="rounded-3xl bg-(--t1-crimson) p-8 text-center shadow-lg">
                  <Icon className="mx-auto size-10 text-white/90" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold uppercase tracking-wide">{c.title}</h3>
                  <p className="mt-2 text-sm font-semibold uppercase text-white/85">{c.detail}</p>
                </article>
              );
            })}
          </div>
          {loans.disclaimers.length > 0 && (
            <ol className="mt-6 list-decimal space-y-2 pl-5 text-[11px] leading-relaxed text-white/70">
              {loans.disclaimers.map((d, i) => <li key={i}>{d}</li>)}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
```
```tsx
// src/templates/t1/Cta.tsx
import type { TemplateProps } from "../types";
import { btnPrimary, container, display } from "./theme";

export function Cta({ copy }: TemplateProps) {
  return (
    <section className="bg-white py-20">
      <div className={`${container} flex flex-col items-center text-center`}>
        <h2 className={`${display} text-4xl font-semibold text-(--t1-teal-deep) sm:text-5xl`}>{copy.cta.heading}</h2>
        <a href="#contact" className={`${btnPrimary} mt-8`}>{copy.cta.buttonLabel}</a>
      </div>
    </section>
  );
}
```
```tsx
// src/templates/t1/Footer.tsx
import type { TemplateProps } from "../types";
import { container } from "./theme";

export function Footer({ copy }: TemplateProps) {
  return (
    <footer className="bg-(--t1-teal-deep) py-8 text-xs text-white/65">
      <div className={`${container} flex flex-col items-center gap-3 text-center`}>
        <p className="max-w-3xl leading-relaxed">{copy.footer.text}</p>
        <nav aria-label="Legal" className="flex gap-4">
          {copy.footer.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-white hover:underline">{l.label}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Contact section + client form**

```tsx
// src/templates/t1/ContactForm.tsx
"use client";

import { useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Status = "idle" | "sending" | "sent" | "error";
const field = "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-800 ring-1 ring-white/20 placeholder:text-slate-400 focus:ring-2 focus:ring-(--t1-orange) focus:outline-none";

export function ContactForm({ slug }: { slug: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const turnstile = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug) return;
    const form = e.currentTarget;
    setStatus("sending");
    setError(null);
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch(`/api/contact/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, turnstileToken: token }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { error?: string; errors?: Record<string, string[]> };
    turnstile.current?.reset();
    setToken("");
    if (res?.ok) {
      form.reset();
      setStatus("sent");
      return;
    }
    setStatus("error");
    setError(body?.errors ? Object.values(body.errors).flat()[0] ?? "Please check the form." : body?.error ?? "Something went wrong. Please try again.");
  }

  if (status === "sent") {
    return <p role="status" className="rounded-2xl bg-white/10 p-6 text-center font-semibold">Thanks! Your message has been sent.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm"><span className="sr-only">Full Name</span>
          <input name="name" required maxLength={100} placeholder="Full Name" aria-label="Full Name" className={field} />
        </label>
        <label className="block text-sm"><span className="sr-only">Email Address</span>
          <input name="email" type="email" required maxLength={254} placeholder="Email Address" aria-label="Email Address" className={field} />
        </label>
      </div>
      <input name="phone" type="tel" maxLength={30} placeholder="Phone" aria-label="Phone" className={field} />
      <textarea name="message" required maxLength={5000} rows={5} placeholder="Message" aria-label="Message" className={field} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {slug ? (
        <Turnstile ref={turnstile} siteKey={siteKey} onSuccess={setToken} onExpire={() => setToken("")} options={{ theme: "light" }} />
      ) : (
        <p className="text-sm text-white/70">The contact form is disabled in preview.</p>
      )}
      {error && <p role="alert" className="text-sm font-medium text-(--t1-orange)">{error}</p>}
      <button type="submit" disabled={!slug || !token || status === "sending"}
        className="inline-flex items-center justify-center rounded-full bg-(--t1-orange) px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-(--t1-orange-deep) disabled:cursor-not-allowed disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
```
```tsx
// src/templates/t1/Contact.tsx
import { Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { ContactForm } from "./ContactForm";
import { container, display, telHref } from "./theme";

export function Contact({ site, copy }: TemplateProps) {
  return (
    <section id="contact" className="bg-(--t1-teal) py-20 text-white lg:py-28">
      <div className={`${container} grid gap-12 lg:grid-cols-2`}>
        <div>
          <h2 className={`${display} text-4xl font-semibold text-(--t1-orange) sm:text-5xl`}>{copy.contact.heading}</h2>
          <p className="mt-4 text-white/85">{copy.contact.intro}</p>
          <p className="mt-8 font-semibold">{copy.contact.credentialLine}</p>
          <p className="mt-1 text-white/75">{copy.hero.servingLine}</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li><a href={telHref(site.phone)} className="flex items-center gap-3 hover:text-(--t1-orange)"><Phone className="size-4" aria-hidden />{site.phone}</a></li>
            <li><a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all hover:text-(--t1-orange)"><Mail className="size-4 shrink-0" aria-hidden />{site.email}</a></li>
            <li className="flex items-start gap-3 text-white/80"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{site.address}</li>
          </ul>
        </div>
        <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/15 sm:p-8">
          <ContactForm slug={site.slug} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Template root and registry**

```tsx
// src/templates/t1/index.tsx
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import type { TemplateProps } from "../types";
import { ClientForms } from "./ClientForms";
import { Contact } from "./Contact";
import { Cta } from "./Cta";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Intro } from "./Intro";
import { Loans } from "./Loans";
import { Services } from "./Services";
import { T1_THEME } from "./theme";

const displayFont = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--t1-font-display" });
const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--t1-font-body" });

export default function TemplateOne(props: TemplateProps) {
  return (
    <div style={T1_THEME}
      className={`${displayFont.variable} ${bodyFont.variable} font-(family-name:--t1-font-body) flex min-h-screen flex-col bg-white text-slate-800`}>
      <Header {...props} />
      <main className="flex-1">
        <Hero {...props} />
        <Intro {...props} />
        <Services {...props} />
        <Faq {...props} />
        <ClientForms {...props} />
        <Loans {...props} />
        <Cta {...props} />
        <Contact {...props} />
      </main>
      <Footer {...props} />
    </div>
  );
}
```
```tsx
// src/templates/registry.tsx
import type { ComponentType } from "react";
import type { TemplateProps } from "./types";
import TemplateOne from "./t1";

const COMPONENTS: Partial<Record<number, ComponentType<TemplateProps>>> = { 1: TemplateOne };

export function getTemplateComponent(n: number): ComponentType<TemplateProps> | null {
  return COMPONENTS[n] ?? null;
}
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint`
Expected: tsc exit 0; eslint has no errors (warnings acceptable). If lucide reports a missing icon name, replace it with the closest existing icon from `node_modules/lucide-react/dist/lucide-react.d.ts`.

- [ ] **Step 8: Commit**

```bash
git add src/templates
git commit -m "feat: template 1 redesign components and template registry"
```

---

### Task 13: Site page, template preview page, revalidation webhook

**Files:**
- Create: `src/app/[slug]/page.tsx`, `src/app/templates/[n]/preview/page.tsx`, `src/app/api/revalidate/route.ts`, `src/app/api/revalidate/route.test.ts`

**Interfaces:**
- Consumes: `getSiteBySlug`, `getTemplateCopy` (Task 8); `getTemplateComponent` (Task 12); `isLiveTemplate`, `getTemplateMeta` (Task 4); `resolveTokens`, `siteTokenValues` (Task 3); `sampleSite` (Task 4); `isValidSlugFormat` (Task 2)
- Produces: routes `/{slug}`, `/templates/{n}/preview`, `POST /api/revalidate`

- [ ] **Step 1: Write failing test for the webhook**

```ts
// src/app/api/revalidate/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ parseBody: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next-sanity/webhook", () => ({ parseBody: mocks.parseBody }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import { POST } from "./route";

const req = () => new Request("http://localhost/api/revalidate", { method: "POST", body: "{}" });

beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

describe("POST /api/revalidate", () => {
  it("401 on bad signature", async () => {
    mocks.parseBody.mockResolvedValue({ isValidSignature: false, body: null });
    expect((await POST(req() as never)).status).toBe(401);
  });
  it("expires the site tag", async () => {
    mocks.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: "site", slug: "jane" } });
    expect((await POST(req() as never)).status).toBe(200);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("site:jane", { expire: 0 });
  });
  it("expires the templates tag", async () => {
    mocks.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: "template" } });
    await POST(req() as never);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("templates", { expire: 0 });
  });
});
```
Run: `npx vitest run src/app/api/revalidate` — Expected: FAIL.

- [ ] **Step 2: Implement the webhook**

```ts
// src/app/api/revalidate/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { parseBody } from "next-sanity/webhook";

export async function POST(req: NextRequest) {
  const { isValidSignature, body } = await parseBody<{ _type?: string; slug?: string }>(
    req,
    process.env.SANITY_REVALIDATE_SECRET,
  );
  if (!isValidSignature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  if (!body?._type) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  if (body._type === "site" && body.slug) revalidateTag(`site:${body.slug}`, { expire: 0 });
  if (body._type === "template") revalidateTag("templates", { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
```
Run: `npx vitest run src/app/api/revalidate` — Expected: PASS.

- [ ] **Step 3: Generated site page**

```tsx
// src/app/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug, getTemplateCopy } from "@/lib/sanity/queries";
import { isValidSlugFormat } from "@/lib/slug";
import { resolveTokens, siteTokenValues } from "@/lib/tokens";
import { isLiveTemplate } from "@/templates/catalog";
import { getTemplateComponent } from "@/templates/registry";

type Props = { params: Promise<{ slug: string }> };

/** Cache Components requires at least one param; real slugs render on demand and are cached by tag. */
export async function generateStaticParams() {
  return [{ slug: "__placeholder__" }];
}

async function load(slug: string) {
  if (!isValidSlugFormat(slug)) return null;
  const site = await getSiteBySlug(slug);
  if (!site || !isLiveTemplate(site.templateNumber)) return null;
  const Template = getTemplateComponent(site.templateNumber);
  const copy = await getTemplateCopy(site.templateNumber);
  if (!Template || !copy) return null;
  return { site, Template, copy: resolveTokens(copy, siteTokenValues(site)) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Page not found" };
  return {
    title: data.site.businessName,
    description: `${data.site.businessName} — serving ${data.site.servingArea}. Call ${data.site.phone}.`,
    openGraph: { title: data.site.businessName, images: [data.site.photoUrl] },
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { Template, site, copy } = data;
  return <Template site={site} copy={copy} />;
}
```

- [ ] **Step 4: Preview page**

```tsx
// src/app/templates/[n]/preview/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateCopy } from "@/lib/sanity/queries";
import { resolveTokens, siteTokenValues } from "@/lib/tokens";
import { getTemplateMeta, isLiveTemplate, TEMPLATE_CATALOG } from "@/templates/catalog";
import { getTemplateComponent } from "@/templates/registry";
import { sampleSite } from "@/templates/sample";

type Props = { params: Promise<{ n: string }> };

export async function generateStaticParams() {
  return TEMPLATE_CATALOG.map((t) => ({ n: String(t.number) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return { title: `Preview — ${getTemplateMeta(Number(n))?.name ?? "Template"}`, robots: { index: false, follow: false } };
}

export default async function PreviewPage({ params }: Props) {
  const n = Number((await params).n);
  if (!isLiveTemplate(n)) notFound();
  const Template = getTemplateComponent(n);
  const copy = await getTemplateCopy(n);
  if (!Template || !copy) notFound();
  const site = sampleSite(n);
  return (
    <>
      <div className="bg-slate-900 py-2 text-center text-xs font-medium text-white">
        Template preview with sample details — your own information replaces it.
      </div>
      <Template site={site} copy={resolveTokens(copy, siteTokenValues(site))} />
    </>
  );
}
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`. Open `http://localhost:3000/templates/1/preview`.
Expected: template 1 renders with Jane Doe sample data, the teal and orange theme, and every section. The FAQ shows only the items that have answers, and the contact form shows "disabled in preview". Check widths of 375 px, 768 px and 1280 px. Open `/templates/2/preview` and expect a 404. Open `/does-not-exist` and expect a 404. Stop the dev server.

- [ ] **Step 6: Verify production build**

Run: `npm run build`
Expected: build succeeds. If it fails with an error about uncached data or `params` outside `<Suspense>` for `/[slug]`, move the body of `SitePage` into an `async function SiteContent({ params })` component and render `<Suspense fallback={null}><SiteContent params={params} /></Suspense>` from the page. Apply the same fix to `/studio/[[...tool]]` if it is reported there. Re-run the build until it passes.

- [ ] **Step 7: Commit**

```bash
git add src/app/[slug] src/app/templates src/app/api/revalidate
git commit -m "feat: generated site route, template preview and revalidation webhook"
```

---

### Task 14: Onboarding form UI (`/create`)

**Files:**
- Create: `src/app/create/page.tsx`, `src/app/create/OnboardingForm.tsx`, `src/app/create/ImageInput.tsx`, `src/app/create/useSlugAvailability.ts`, `src/app/create/useSlugAvailability.test.ts`

**Interfaces:**
- Consumes: `ONBOARDING_FIELDS`, `FieldDef` (Task 5); `TEMPLATE_CATALOG` (Task 4); slug utils + `SlugCheckResponse` (Task 2); `GET /api/slug-available` (Task 9); `POST /api/sites` contract (Task 10)
- Produces: `localSlugStatus(slug: string): SlugStatus | null`; `useSlugAvailability(slug: string, delayMs?: number): { status: SlugStatus; checkNow: () => void; markTaken: (suggestion?: string) => void }`; `type SlugStatus`

- [ ] **Step 1: Write failing test for the pure part of the hook**

```ts
// src/app/create/useSlugAvailability.test.ts
import { describe, expect, it } from "vitest";
import { localSlugStatus } from "./useSlugAvailability";

describe("localSlugStatus", () => {
  it("is idle for empty input", () => {
    expect(localSlugStatus("")).toEqual({ state: "idle" });
  });
  it("is invalid for bad format or reserved names", () => {
    expect(localSlugStatus("a")?.state).toBe("invalid");
    expect(localSlugStatus("studio")).toEqual({ state: "invalid", message: "This address is reserved — please choose a different one." });
  });
  it("returns null when a server check is needed", () => {
    expect(localSlugStatus("jane-doe")).toBeNull();
  });
});
```
Run: `npx vitest run src/app/create` — Expected: FAIL.

- [ ] **Step 2: Implement the hook**

```ts
// src/app/create/useSlugAvailability.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isReservedSlug, isValidSlugFormat, RESERVED_MESSAGE, SLUG_FORMAT_MESSAGE, type SlugCheckResponse,
} from "@/lib/slug";

export type SlugStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; message: string; suggestion?: string }
  | { state: "invalid"; message: string }
  | { state: "error" };

export function localSlugStatus(slug: string): SlugStatus | null {
  if (!slug) return { state: "idle" };
  if (!isValidSlugFormat(slug)) return { state: "invalid", message: SLUG_FORMAT_MESSAGE };
  if (isReservedSlug(slug)) return { state: "invalid", message: RESERVED_MESSAGE };
  return null;
}

/**
 * Checks the slug as soon as the user types (debounced) and immediately on blur via `checkNow`.
 * Status is derived per-slug so stale responses for an old value are ignored.
 */
export function useSlugAvailability(slug: string, delayMs = 400) {
  const [remote, setRemote] = useState<{ slug: string; status: SlugStatus } | null>(null);
  const latest = useRef(slug);
  latest.current = slug;

  const check = useCallback(async (value: string) => {
    if (localSlugStatus(value)) return;
    try {
      const res = await fetch(`/api/slug-available?slug=${encodeURIComponent(value)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as SlugCheckResponse;
      const status: SlugStatus = body.available
        ? { state: "available" }
        : body.reason === "taken"
          ? { state: "taken", message: body.message, suggestion: body.suggestion }
          : { state: "invalid", message: body.message };
      if (latest.current === value) setRemote({ slug: value, status });
    } catch {
      if (latest.current === value) setRemote({ slug: value, status: { state: "error" } });
    }
  }, []);

  useEffect(() => {
    if (localSlugStatus(slug)) return;
    const timer = setTimeout(() => void check(slug), delayMs);
    return () => clearTimeout(timer);
  }, [slug, delayMs, check]);

  const local = localSlugStatus(slug);
  const status: SlugStatus = local ?? (remote?.slug === slug ? remote.status : { state: "checking" });

  return {
    status,
    checkNow: () => void check(slug),
    markTaken: (suggestion?: string) =>
      setRemote({
        slug,
        status: { state: "taken", message: "This address is already taken — please choose a different one.", suggestion },
      }),
  };
}
```
Run: `npx vitest run src/app/create` — Expected: PASS.

- [ ] **Step 3: Image input**

```tsx
// src/app/create/ImageInput.tsx
"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";

export function ImageInput(props: {
  name: string; label: string; accept: readonly string[]; help: string; error?: string; rounded?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const id = `field-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">{props.label}</label>
      <div className="mt-2 flex items-center gap-4">
        <div className={`grid size-20 shrink-0 place-items-center overflow-hidden bg-slate-100 ring-1 ring-slate-200 ${props.rounded ? "rounded-full" : "rounded-xl"}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-slate-400" aria-hidden />
          )}
        </div>
        <div className="flex-1">
          <input id={id} name={props.name} type="file" required accept={props.accept.join(",")}
            aria-invalid={props.error ? true : undefined} aria-describedby={`${id}-help`}
            onChange={(e) => {
              if (preview) URL.revokeObjectURL(preview);
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700" />
          <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">{props.help}</p>
          {props.error && <p className="mt-1 text-sm text-red-600">{props.error}</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Onboarding form**

```tsx
// src/app/create/OnboardingForm.tsx
"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { ONBOARDING_FIELDS, type FieldDef } from "@/forms/onboarding.fields";
import { slugify } from "@/lib/slug";
import { TEMPLATE_CATALOG } from "@/templates/catalog";
import { ImageInput } from "./ImageInput";
import { useSlugAvailability, type SlugStatus } from "./useSlugAvailability";

type Errors = Partial<Record<string, string[]>>;

const input =
  "mt-2 block w-full rounded-xl border-0 px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:outline-none aria-[invalid=true]:ring-red-500";

const siteHost = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/^https?:\/\//, "").replace(/\/+$/, "");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function SlugMessage({ status, onUseSuggestion }: { status: SlugStatus; onUseSuggestion: (s: string) => void }) {
  switch (status.state) {
    case "checking":
      return <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden />Checking…</p>;
    case "available":
      return <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600"><CheckCircle2 className="size-4" aria-hidden />Available</p>;
    case "taken":
      return (
        <p className="mt-2 text-sm text-red-600">
          <XCircle className="mr-1 inline size-4" aria-hidden />{status.message}
          {status.suggestion && (
            <> Try{" "}
              <button type="button" onClick={() => onUseSuggestion(status.suggestion!)} className="font-semibold underline">{status.suggestion}</button>
            </>
          )}
        </p>
      );
    case "invalid":
      return <p className="mt-2 text-sm text-red-600">{status.message}</p>;
    case "error":
      return <p className="mt-2 text-sm text-amber-600">Couldn&apos;t check this address right now — we&apos;ll check again when you submit.</p>;
    default:
      return null;
  }
}

export function OnboardingForm() {
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [template, setTemplate] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ url: string; email: string } | null>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const slugCheck = useSlugAvailability(slug);

  const err = (name: string) => errors[name]?.[0];
  const canSubmit = slugCheck.status.state === "available" && template !== null && token !== "" && !submitting;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("slug", slug);
    fd.set("cf-turnstile-response", token);
    try {
      const res = await fetch("/api/sites", { method: "POST", body: fd });
      const body = (await res.json().catch(() => ({}))) as { url?: string; errors?: Errors; suggestion?: string; error?: string };
      if (res.status === 201 && body.url) {
        setCreated({ url: body.url, email: String(fd.get("email")) });
        window.scrollTo({ top: 0 });
        return;
      }
      if (res.status === 409) slugCheck.markTaken(body.suggestion);
      if (body.errors) setErrors(body.errors);
      setFormError(body.error ?? "Please fix the highlighted fields.");
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
      turnstile.current?.reset();
      setToken("");
    }
  }

  if (created) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" aria-hidden />
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">Your webpage is live!</h2>
        <p className="mt-2 text-slate-600">We&apos;ve also emailed the link to <strong>{created.email}</strong>.</p>
        <a href={created.url} target="_blank" rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
          {created.url.replace(/^https?:\/\//, "")} <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>
    );
  }

  const textField = (def: FieldDef) => {
    const id = `field-${def.name}`;
    const common = {
      id, name: def.name, required: true, maxLength: def.maxLength, placeholder: def.placeholder,
      autoComplete: def.autoComplete, "aria-invalid": err(def.name) ? true : undefined,
      "aria-describedby": def.help ? `${id}-help` : undefined, className: input,
    };
    return (
      <div key={def.name} className={def.type === "textarea" || def.name === "email" ? "sm:col-span-2" : ""}>
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">{def.label}</label>
        {def.type === "textarea" ? (
          <textarea rows={2} {...common} />
        ) : (
          <input type={def.type === "text" ? "text" : def.type} {...common}
            onChange={def.name === "businessName" ? (e) => { if (!slugEdited) setSlug(slugify(e.target.value)); } : undefined} />
        )}
        {def.help && <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">{def.help}</p>}
        {err(def.name) && <p className="mt-1 text-sm text-red-600">{err(def.name)}</p>}
      </div>
    );
  };

  const textDefs = ONBOARDING_FIELDS.filter((f) => ["text", "email", "tel", "textarea"].includes(f.type));
  const imageDefs = ONBOARDING_FIELDS.filter((f) => f.type === "image");

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate={false}>
      <Section title="Your details">{textDefs.map(textField)}</Section>

      <Section title="Your web address">
        <div className="sm:col-span-2">
          <label htmlFor="field-slug" className="block text-sm font-semibold text-slate-800">Web address</label>
          <div className="mt-2 flex rounded-xl shadow-sm ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-slate-900">
            <span className="flex items-center rounded-l-xl bg-slate-50 px-3 text-sm text-slate-500">{siteHost}/</span>
            <input id="field-slug" name="slug" required maxLength={50} value={slug} autoComplete="off" spellCheck={false}
              aria-invalid={["taken", "invalid"].includes(slugCheck.status.state) ? true : undefined}
              onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
              onBlur={() => slugCheck.checkNow()}
              className="block w-full rounded-r-xl border-0 px-3 py-3 text-sm text-slate-900 focus:outline-none" />
          </div>
          <SlugMessage status={slugCheck.status} onUseSuggestion={(s) => { setSlugEdited(true); setSlug(s); }} />
          {err("slug") && slugCheck.status.state !== "taken" && <p className="mt-1 text-sm text-red-600">{err("slug")}</p>}
        </div>
      </Section>

      <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <legend className="sr-only">Template</legend>
        <h2 className="text-lg font-semibold text-slate-900">Choose a template</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATE_CATALOG.map((t) => {
            const live = t.status === "live";
            return (
              <div key={t.number} className={`rounded-2xl p-4 ring-1 transition ${template === t.number ? "ring-2 ring-slate-900" : "ring-slate-200"} ${live ? "" : "opacity-60"}`}>
                <div className="flex h-20 overflow-hidden rounded-xl" aria-hidden>
                  <span className="flex-[2]" style={{ background: t.swatch[0] }} />
                  <span className="flex-1" style={{ background: t.swatch[1] }} />
                </div>
                <label className={`mt-3 flex items-center gap-2 text-sm font-semibold ${live ? "cursor-pointer" : "cursor-not-allowed"}`}>
                  <input type="radio" name="templateNumber" value={t.number} disabled={!live} required
                    checked={template === t.number} onChange={() => setTemplate(t.number)} />
                  Template {t.number} — {t.name}
                </label>
                {live ? (
                  <a href={`/templates/${t.number}/preview`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 underline">
                    Preview <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Coming soon</p>
                )}
              </div>
            );
          })}
        </div>
        {err("templateNumber") && <p className="mt-3 text-sm text-red-600">{err("templateNumber")}</p>}
      </fieldset>

      <Section title="Branding">
        {imageDefs.map((def) => (
          <ImageInput key={def.name} name={def.name} label={def.label} accept={def.accept}
            rounded={def.name === "photo"} error={err(def.name)}
            help={`${def.accept.map((a) => a.split("/")[1].replace("+xml", "").toUpperCase()).join(", ")} · max 5 MB`} />
        ))}
      </Section>

      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="flex flex-col items-start gap-4">
        <Turnstile ref={turnstile} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
          onSuccess={setToken} onExpire={() => setToken("")} />
        {formError && <p role="alert" className="text-sm font-medium text-red-600">{formError}</p>}
        <button type="submit" disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitting ? "Creating your webpage…" : "Create my webpage"}
        </button>
        {slugCheck.status.state !== "available" && slug !== "" && (
          <p className="text-xs text-slate-500">Choose an available web address to continue.</p>
        )}
      </div>
    </form>
  );
}
```
In this snippet `textDefs.map(textField)` passes the `as const` tuple element type into `(def: FieldDef)`, which is assignable. If TypeScript complains, write `textDefs.map((d) => textField(d))`. The `def.accept` is only defined for image fields, so the `imageDefs` filter narrows correctly. If it doesn't narrow, use `def.accept ?? []`.

- [ ] **Step 5: Page**

```tsx
// src/app/create/page.tsx
import type { Metadata } from "next";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Create your webpage — Affordabiz" };

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Affordabiz</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Create your webpage</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Fill in your details, pick a template and your professional webpage goes live instantly. We&apos;ll email you the link.
        </p>
        <div className="mt-10"><OnboardingForm /></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify manually**

Run: `npm run dev`. With Turnstile test keys and real Sanity credentials in `.env.local`, open `http://localhost:3000/create` and check each of these:
1. Typing a business name auto-fills the web address.
2. Typing `ab` shows the format error straight away, with no network request.
3. Typing `studio` shows "reserved".
4. A new address shows "Checking…" and then "Available" within about half a second.
5. Submit stays disabled until the address is available, a template is selected and Turnstile has passed.
6. Submitting creates the site and shows the "Your webpage is live!" screen.
7. Opening the link shows the site with your data.
8. Reloading `/create` and entering the same address shows "This address is already taken — please choose a different one" with a clickable suggestion. Clicking it fills in the field and the status flips to Available.

Then stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/app/create
git commit -m "feat: onboarding form with live slug check, template picker and uploads"
```

---

### Task 15: Landing page, README, end-to-end test, final verification

**Files:**
- Modify: `src/app/page.tsx`, `README.md`
- Create: `playwright.config.ts`, `e2e/onboarding.spec.ts`, `e2e/fixtures/pixel.png`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Landing page**

```tsx
// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-24">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Affordabiz</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">Your professional webpage, live in minutes.</h1>
        <p className="mt-5 text-lg text-slate-600">Pick a template, add your details and logo, and get a shareable link straight away.</p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/create" className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-slate-700">Create my webpage</Link>
          <Link href="/templates/1/preview" target="_blank" className="rounded-full px-7 py-3.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-white">Preview a template</Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Playwright setup**

```bash
npx playwright install chromium
node -e "require('fs').mkdirSync('e2e/fixtures',{recursive:true});require('fs').writeFileSync('e2e/fixtures/pixel.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'))"
```
```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      BREVO_DRY_RUN: "1",
      NEXT_PUBLIC_SANITY_DATASET: process.env.E2E_SANITY_DATASET ?? "test",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
```
The Next 16 dev lockfile blocks a second `next dev` in the same folder. Stop any running dev server before `npm run e2e`.

- [ ] **Step 3: Write the E2E test**

```ts
// e2e/onboarding.spec.ts
import path from "node:path";
import { expect, test } from "@playwright/test";

const PIXEL = path.join(__dirname, "fixtures", "pixel.png");
const slug = `e2e-${Date.now()}`;

test.describe.serial("onboarding → site → contact", () => {
  test("owner creates a webpage", async ({ page }) => {
    await page.goto("/create");
    await page.getByLabel("Full name").fill("Erin Example");
    await page.getByLabel("Business name").fill("E2E Tax Service");
    await page.getByLabel("Email").fill("erin@example.com");
    await page.getByLabel("Phone").fill("(404) 555-0100");
    await page.getByLabel("Business address").fill("1 Test St, Atlanta, GA");
    await page.getByLabel("Serving area").fill("Atlanta & Surrounding States");
    await page.getByLabel("Web address").fill(slug);
    await expect(page.getByText("Available", { exact: true })).toBeVisible({ timeout: 15_000 });
    await page.getByLabel(/Template 1/).check();
    await page.getByLabel("Logo").setInputFiles(PIXEL);
    await page.getByLabel("Your photo").setInputFiles(PIXEL);
    const submit = page.getByRole("button", { name: "Create my webpage" });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();
    await expect(page.getByRole("heading", { name: "Your webpage is live!" })).toBeVisible({ timeout: 30_000 });
  });

  test("the slug is now reported as taken", async ({ page }) => {
    await page.goto("/create");
    await page.getByLabel("Web address").fill(slug);
    await page.getByLabel("Web address").blur();
    await expect(page.getByText("This address is already taken — please choose a different one.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Create my webpage" })).toBeDisabled();
  });

  test("the webpage renders and its contact form sends", async ({ page }) => {
    await page.goto(`/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Tax Service" })).toBeVisible();
    await expect(page.getByText("Erin Example, PTIN-Certified Tax Professional")).toBeVisible();
    await page.getByLabel("Full Name").fill("Vic Visitor");
    await page.getByLabel("Email Address").fill("vic@example.com");
    await page.getByLabel("Message").fill("Can you help with my return?");
    const submit = page.getByRole("button", { name: "Submit" });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();
    await expect(page.getByText("Thanks! Your message has been sent.")).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 4: Run the E2E suite**

Run: `npm run e2e`
Expected: 3 tests pass, and the dev server log shows two `[brevo:dry-run]` lines (site ready and contact). This needs the Sanity `test` dataset to exist and the write token to have access to it.

- [ ] **Step 5: README**

Replace `README.md` with:
```markdown
# Affordabiz Site Generator

Public form at `/create` → creates a webpage at `/{slug}` from a template, stores it in Sanity, emails the owner via Brevo. Each page's contact form emails the owner.

## Setup
1. `cp .env.example .env.local` and fill in values (see below).
2. `npm install`
3. `npm run seed` — creates Template 1–7 documents in Sanity (overwrites template text; run once).
4. `npm run dev` → http://localhost:3000 · Studio at /studio

## Environment
| Var | Where |
|---|---|
| NEXT_PUBLIC_SITE_URL | Public base URL, e.g. https://pages.affordabiz.com |
| NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET | sanity.io/manage |
| SANITY_API_WRITE_TOKEN | Sanity API token (Editor) |
| SANITY_REVALIDATE_SECRET | Any random string; also set on the Sanity webhook |
| BREVO_API_KEY / BREVO_SENDER_EMAIL / BREVO_SENDER_NAME | Brevo → SMTP & API; sender must be verified |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY | Cloudflare Turnstile |

## Sanity webhook
URL `{NEXT_PUBLIC_SITE_URL}/api/revalidate`, filter `_type in ["site","template"]`, projection `{_type, "slug": slug.current}`, secret = `SANITY_REVALIDATE_SECRET`.

## Admin tasks
- Take a page offline: Studio → Site → turn off "published".
- Edit template wording: Studio → Template N → Fixed text. Tokens: `{{fullName}} {{businessName}} {{email}} {{phone}} {{address}} {{servingArea}}`.
- **To do:** paste Refund Advantage disclaimers and remaining FAQ answers into Template 1.

## Adding templates 2–7
1. Build `src/templates/tN/` (same `TemplateProps`) + `tN/defaultCopy.ts`.
2. Register in `src/templates/registry.tsx` and `src/templates/defaults.ts`.
3. Set `status: "live"` in `src/templates/catalog.ts`.
4. `npm run seed` (or create the Template N copy in Studio).

## Scripts
`npm test` (unit) · `npm run e2e` (needs Sanity `test` dataset) · `npm run typecheck` · `npm run lint` · `npm run build`
```

- [ ] **Step 6: Final verification**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: every unit test passes, `tsc` exits 0, `eslint` reports no errors, and `next build` succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: landing page, README and end-to-end onboarding test"
```
