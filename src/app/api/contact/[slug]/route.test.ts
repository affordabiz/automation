import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyTurnstile: vi.fn(),
  getSiteBySlug: vi.fn(),
  logContactMessage: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/entries/live", () => ({ getSiteBySlug: mocks.getSiteBySlug }));
vi.mock("@/lib/entries/store", () => ({ logContactMessage: mocks.logContactMessage }));
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
    expect(mocks.logContactMessage).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: "site-jane", emailStatus: "sent" }),
    );
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
