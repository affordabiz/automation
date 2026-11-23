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
