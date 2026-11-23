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
