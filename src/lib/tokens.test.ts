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
