import { afterEach, describe, expect, it, vi } from "vitest";
import { siteBase, siteUrl } from "./siteUrl";

afterEach(() => vi.unstubAllEnvs());

describe("siteUrl", () => {
  it("joins base and slug without double slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    expect(siteUrl("jane-doe")).toBe("https://example.com/jane-doe");
  });
  it("falls back to localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(siteUrl("x1y")).toBe("http://localhost:3000/x1y");
  });
  it("ignores a localhost value on Vercel and uses the production domain", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "app.example.com");
    expect(siteBase()).toBe("https://app.example.com");
  });
  it("keeps a real configured domain on Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://affordabiz.com");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "app.example.com");
    expect(siteBase()).toBe("https://affordabiz.com");
  });
});
