import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyTurnstile: vi.fn(),
  checkSlug: vi.fn(),
  createPendingEntry: vi.fn(),
  emailClient: vi.fn(),
  publishEntry: vi.fn(),
  resolveAccess: vi.fn(),
  ownEntries: vi.fn(),
  claimOnce: vi.fn(),
  releaseClaim: vi.fn(),
  updatePayment: vi.fn(),
  alertReplaceFailure: vi.fn(),
  rpc: vi.fn(),
  recordAudit: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/slugCheck", () => ({ checkSlug: mocks.checkSlug }));
vi.mock("@/lib/entries/store", () => ({ createPendingEntry: mocks.createPendingEntry }));
vi.mock("@/lib/entries/workflow", () => ({ emailClient: mocks.emailClient, publishEntry: mocks.publishEntry }));
vi.mock("@/lib/payments/access", () => ({ resolveAccess: mocks.resolveAccess, ownEntries: mocks.ownEntries }));
vi.mock("@/lib/payments/store", () => ({
  claimOnce: mocks.claimOnce,
  releaseClaim: mocks.releaseClaim,
  updatePayment: mocks.updatePayment,
}));
vi.mock("@/lib/payments/service", () => ({ alertReplaceFailure: mocks.alertReplaceFailure }));
vi.mock("@/lib/supabase/service", () => ({ serviceClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/admin/audit", () => ({ recordAudit: mocks.recordAudit }));

import { POST } from "./route";
import { __resetRateLimits } from "@/lib/rateLimit";

const png = () => new File([new Uint8Array([137, 80, 78, 71])], "a.png", { type: "image/png" });
const entry = { id: "entry-1", slug: "jane-doe-tax", full_name: "Jane Doe", business_name: "Jane Doe Tax Service" };
const payment = (product: "renew" | "new" = "new") => ({
  id: "pay-1",
  product,
  email: "jane@example.com",
  access_token: "11111111-1111-4111-8111-111111111111",
});
const oldPage = {
  id: "old-1",
  slug: "jane-doe-tax",
  template_number: 3,
  logo_path: "image-abc-10x10-png",
  photo_path: null,
  logo_url: null,
  photo_url: "https://cdn.example/photo.png",
};

function request(overrides: Record<string, string | null> = {}, images = true) {
  const fd = new FormData();
  const base: Record<string, string> = {
    fullName: "Jane Doe", businessName: "Jane Doe Tax Service", email: "jane@example.com",
    phone: "(404) 111-2222", address: "1 Main St", servingArea: "Atlanta", slug: "jane-doe-tax",
    templateNumber: "1", "cf-turnstile-response": "tok", access: payment().access_token,
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) if (v !== null) fd.set(k, v);
  if (images) {
    fd.set("logo", png());
    fd.set("photo", png());
  }
  return new Request("http://localhost/api/sites", { method: "POST", body: fd, headers: { "x-forwarded-for": "1.2.3.4" } });
}

beforeEach(() => {
  __resetRateLimits();
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.verifyTurnstile.mockResolvedValue(true);
  mocks.checkSlug.mockResolvedValue({ available: true });
  mocks.createPendingEntry.mockResolvedValue({ result: "created", entry });
  mocks.emailClient.mockResolvedValue("sent");
  mocks.publishEntry.mockResolvedValue({ ok: true, emailStatus: "sent" });
  mocks.resolveAccess.mockResolvedValue({ state: "ok", payment: payment() });
  mocks.ownEntries.mockResolvedValue([oldPage]);
  mocks.claimOnce.mockResolvedValue(true);
  mocks.updatePayment.mockResolvedValue({});
  mocks.rpc.mockResolvedValue({ data: "jane-doe-tax", error: null });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://affordabiz.test");
});

describe("POST /api/sites", () => {
  it("publishes a paid new webpage straight away and links it to the payment", async () => {
    const res = await POST(request());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ status: "published", url: "https://affordabiz.test/jane-doe-tax" });
    expect(mocks.createPendingEntry).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "jane-doe-tax", templateNumber: 1 }),
      expect.any(File),
      expect.any(File),
      undefined,
      { paymentId: "pay-1" },
    );
    expect(mocks.claimOnce).toHaveBeenCalledWith("pay-1", "used_at");
    expect(mocks.updatePayment).toHaveBeenCalledWith("pay-1", { entry_id: "entry-1", previous_entry_id: null });
    expect(mocks.publishEntry).toHaveBeenCalledWith(entry, null);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", "Please pay for your webpage first."],
    ["unpaid", "Your payment hasn't gone through yet. Please complete the payment first."],
    ["used", "This payment has already been used to create a webpage."],
    ["revoked", "This payment was refunded or disputed, so this link no longer works."],
  ])("403 without a usable payment (%s)", async (state, message) => {
    mocks.resolveAccess.mockResolvedValue({ state, payment: payment() });
    const res = await POST(request());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: message });
    expect(mocks.createPendingEntry).not.toHaveBeenCalled();
  });

  it("403 when the payment was already used by a simultaneous submission", async () => {
    mocks.claimOnce.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.createPendingEntry).not.toHaveBeenCalled();
  });

  it("renewal keeps the address and template, reuses images, and moves the old page to draft", async () => {
    mocks.resolveAccess.mockResolvedValue({ state: "ok", payment: payment("renew") });
    const res = await POST(request({ replaceId: "old-1", templateNumber: "1" }, false));
    expect(await res.json()).toEqual({ status: "published", url: "https://affordabiz.test/jane-doe-tax" });
    expect(mocks.checkSlug).not.toHaveBeenCalled();
    const [data, logo, photo] = mocks.createPendingEntry.mock.calls[0];
    expect(data.templateNumber).toBe(3);
    expect(data.slug).toMatch(/^r-[a-f0-9]{24}$/);
    expect(logo).toEqual({ path: "image-abc-10x10-png", url: null });
    expect(photo).toEqual({ path: null, url: "https://cdn.example/photo.png" });
    expect(mocks.rpc).toHaveBeenCalledWith("replace_entry", { p_old_id: "old-1", p_new_id: "entry-1", p_slug: "jane-doe-tax" });
    expect(mocks.publishEntry).toHaveBeenCalledWith({ ...entry, slug: "jane-doe-tax" }, null);
  });

  it("renewal requires a page to renew", async () => {
    mocks.resolveAccess.mockResolvedValue({ state: "ok", payment: payment("renew") });
    expect((await POST(request())).status).toBe(400);
  });

  it("403 when the page to replace doesn't belong to the payer's email", async () => {
    mocks.ownEntries.mockResolvedValue([]);
    expect((await POST(request({ replaceId: "someone-else" }))).status).toBe(403);
    expect(mocks.createPendingEntry).not.toHaveBeenCalled();
  });

  it("a replacement with a new address checks that address", async () => {
    mocks.checkSlug.mockResolvedValue({ available: false, reason: "taken", message: "taken" });
    expect((await POST(request({ replaceId: "old-1", slug: "brand-new" }))).status).toBe(409);
  });

  it("leaves the entry for review and alerts admins when publishing fails", async () => {
    mocks.publishEntry.mockResolvedValue({ ok: false, error: "no" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await (await POST(request())).json()).toEqual({ status: "pending" });
    expect(mocks.alertReplaceFailure).toHaveBeenCalled();
    expect(mocks.emailClient).toHaveBeenCalled();
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

  it("409 and frees the payment when the create races with another submission", async () => {
    mocks.createPendingEntry.mockResolvedValue({ result: "conflict" });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.releaseClaim).toHaveBeenCalledWith("pay-1", "used_at");
  });

  it("500 and frees the payment when the database fails", async () => {
    mocks.createPendingEntry.mockRejectedValue(new Error("database down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(500);
    expect(mocks.releaseClaim).toHaveBeenCalledWith("pay-1", "used_at");
    spy.mockRestore();
  });

  it("429 after 10 submissions per hour", async () => {
    for (let i = 0; i < 10; i++) await POST(request());
    expect((await POST(request())).status).toBe(429);
  });
});
