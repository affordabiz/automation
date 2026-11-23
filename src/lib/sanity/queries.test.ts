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
