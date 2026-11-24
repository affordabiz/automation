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
    const r = parseOnboarding(form({ fullName: "", email: "nope", phone: "abc", slug: "a--b", templateNumber: "3" }));
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
