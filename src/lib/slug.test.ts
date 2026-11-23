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
