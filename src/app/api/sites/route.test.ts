import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyTurnstile: vi.fn(),
  checkSlug: vi.fn(),
  createPendingEntry: vi.fn(),
  getAutoPublish: vi.fn(),
  emailClient: vi.fn(),
  publishEntry: vi.fn(),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/slugCheck", () => ({ checkSlug: mocks.checkSlug }));
vi.mock("@/lib/entries/store", () => ({
  createPendingEntry: mocks.createPendingEntry,
  getAutoPublish: mocks.getAutoPublish,
}));
vi.mock("@/lib/entries/workflow", () => ({ emailClient: mocks.emailClient, publishEntry: mocks.publishEntry }));

import { POST } from "./route";
import { __resetRateLimits } from "@/lib/rateLimit";

const png = () => new File([new Uint8Array([137, 80, 78, 71])], "a.png", { type: "image/png" });
const entry = { id: "entry-1", slug: "jane-doe-tax" };

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
  mocks.createPendingEntry.mockResolvedValue({ result: "created", entry });
  mocks.getAutoPublish.mockResolvedValue(false);
  mocks.emailClient.mockResolvedValue("sent");
  mocks.publishEntry.mockResolvedValue({ ok: true, emailStatus: "sent" });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://affordabiz.test");
});

describe("POST /api/sites", () => {
  it("saves a pending entry, returns no public URL and emails a receipt", async () => {
    const res = await POST(request());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ status: "pending" });
    expect(mocks.createPendingEntry).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "jane-doe-tax", templateNumber: 1 }),
      expect.any(File),
      expect.any(File),
    );
    expect(mocks.publishEntry).not.toHaveBeenCalled();
    expect(mocks.emailClient.mock.calls[0][1].subject).toBe("We received your request — Jane Doe Tax Service");
  });

  it("publishes immediately when auto-publish is on", async () => {
    mocks.getAutoPublish.mockResolvedValue(true);
    const res = await POST(request());
    expect(await res.json()).toEqual({ status: "published", url: "https://affordabiz.test/jane-doe-tax" });
    expect(mocks.publishEntry).toHaveBeenCalledWith(entry, null);
    expect(mocks.emailClient).not.toHaveBeenCalled();
  });

  it("falls back to manual review when auto-publish fails", async () => {
    mocks.getAutoPublish.mockResolvedValue(true);
    mocks.publishEntry.mockResolvedValue({ ok: false, error: "no" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await (await POST(request())).json()).toEqual({ status: "pending" });
    expect(mocks.emailClient).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("keeps manual review when the setting can't be read", async () => {
    mocks.getAutoPublish.mockRejectedValue(new Error("down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await (await POST(request())).json()).toEqual({ status: "pending" });
    expect(mocks.publishEntry).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("400 with field errors on invalid input", async () => {
    const res = await POST(request({ email: "bad" }));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.email).toBeDefined();
    expect(mocks.createPendingEntry).not.toHaveBeenCalled();
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
      errors: { slug: ["This address is already taken — please choose a different one."] },
      suggestion: "jane-doe-tax-2",
    });
  });

  it("409 when the create races with another submission", async () => {
    mocks.createPendingEntry.mockResolvedValue({ result: "conflict" });
    expect((await POST(request())).status).toBe(409);
  });

  it("500 when the database fails", async () => {
    mocks.createPendingEntry.mockRejectedValue(new Error("database down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(500);
    spy.mockRestore();
  });

  it("429 after 5 submissions per hour", async () => {
    for (let i = 0; i < 5; i++) await POST(request());
    expect((await POST(request())).status).toBe(429);
  });
});
