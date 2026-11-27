import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPayment: vi.fn(),
  getPaymentBySession: vi.fn(),
  getPaymentByIntent: vi.fn(),
  updatePayment: vi.fn(),
  claimOnce: vi.fn(),
  releaseClaim: vi.fn(),
  createPayment: vi.fn(),
  adminRecipients: vi.fn(),
  sendEmail: vi.fn(),
  recordAudit: vi.fn(),
  invoicesRetrieve: vi.fn(),
  entryUpdate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("./store", () => ({
  getPayment: mocks.getPayment,
  getPaymentBySession: mocks.getPaymentBySession,
  getPaymentByIntent: mocks.getPaymentByIntent,
  updatePayment: mocks.updatePayment,
  claimOnce: mocks.claimOnce,
  releaseClaim: mocks.releaseClaim,
  createPayment: mocks.createPayment,
  adminRecipients: mocks.adminRecipients,
}));
vi.mock("./stripe", () => ({ stripe: () => ({ invoices: { retrieve: mocks.invoicesRetrieve } }) }));
vi.mock("@/lib/brevo", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/admin/audit", () => ({ recordAudit: mocks.recordAudit }));
vi.mock("@/lib/supabase/service", () => {
  const chain = {
    update: () => chain,
    eq: () => chain,
    select: () => chain,
    maybeSingle: () => mocks.entryUpdate(),
  };
  return { serviceClient: () => ({ from: () => chain }) };
});

import { handleRefund, handleSessionExpired, recordFailedAttempt, syncCheckoutSession } from "./service";

const base = {
  id: "pay-1",
  product: "new",
  amount_cents: 4699,
  currency: "usd",
  status: "pending",
  email: null,
  customer_name: null,
  paid_at: null,
  failed_attempts: 0,
  failure_reason: null,
  access_token: "11111111-1111-4111-8111-111111111111",
  used_at: null,
  entry_id: null,
  invoice_url: null,
  livemode: false,
};

const session = (over: Record<string, unknown> = {}) =>
  ({
    id: "cs_1",
    metadata: { payment_id: "pay-1" },
    client_reference_id: "pay-1",
    payment_status: "paid",
    customer_details: { email: "Jane@Example.com", name: "Jane Doe" },
    payment_intent: "pi_1",
    customer: "cus_1",
    invoice: "in_1",
    livemode: false,
    ...over,
  }) as never;

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://affordabiz.test");
  mocks.getPayment.mockResolvedValue(base);
  mocks.claimOnce.mockResolvedValue(true);
  mocks.sendEmail.mockResolvedValue({ ok: true, messageId: "m1" });
  mocks.adminRecipients.mockResolvedValue(["owner@affordabiz.test"]);
  mocks.invoicesRetrieve.mockResolvedValue({ hosted_invoice_url: "https://invoice.test/1", invoice_pdf: "https://invoice.test/1.pdf" });
});

describe("syncCheckoutSession", () => {
  it("marks the payment paid and emails the invoice and form link once", async () => {
    const paid = { ...base, status: "paid", email: "jane@example.com", customer_name: "Jane Doe", invoice_url: "https://invoice.test/1" };
    mocks.updatePayment.mockResolvedValue(paid);
    await syncCheckoutSession(session());

    expect(mocks.updatePayment).toHaveBeenCalledWith(
      "pay-1",
      expect.objectContaining({ status: "paid", email: "jane@example.com", stripe_payment_intent_id: "pi_1", invoice_url: "https://invoice.test/1" }),
      ["pending", "failed", "expired"],
    );
    expect(mocks.claimOnce).toHaveBeenCalledWith("pay-1", "access_email_sent_at");
    const email = mocks.sendEmail.mock.calls[0][0];
    expect(email.to.email).toBe("jane@example.com");
    expect(email.text).toContain("https://affordabiz.test/create?access=11111111-1111-4111-8111-111111111111");
    expect(email.text).toContain("https://invoice.test/1");
    const alert = mocks.sendEmail.mock.calls[1][0];
    expect(alert.to.email).toBe("owner@affordabiz.test");
    expect(alert.subject).toContain("New payment received");
  });

  it("does not email again when another request already sent it", async () => {
    mocks.updatePayment.mockResolvedValue(null);
    mocks.getPayment.mockResolvedValue({ ...base, status: "paid", email: "jane@example.com" });
    mocks.claimOnce.mockResolvedValue(false);
    await syncCheckoutSession(session());
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("ignores sessions that are not paid yet", async () => {
    await syncCheckoutSession(session({ payment_status: "unpaid" }));
    expect(mocks.updatePayment).not.toHaveBeenCalled();
  });

  it("frees the email claim so a retry can send it if Brevo fails", async () => {
    mocks.updatePayment.mockResolvedValue({ ...base, status: "paid", email: "jane@example.com" });
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "down" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await syncCheckoutSession(session());
    expect(mocks.releaseClaim).toHaveBeenCalledWith("pay-1", "access_email_sent_at");
    spy.mockRestore();
  });
});

describe("failed payments", () => {
  it("records a declined attempt without emailing yet", async () => {
    mocks.updatePayment.mockResolvedValue({ ...base, status: "failed" });
    await recordFailedAttempt({
      id: "pi_1",
      metadata: { payment_id: "pay-1" },
      livemode: false,
      receipt_email: null,
      last_payment_error: { message: "Your card was declined.", payment_method: { billing_details: { email: "jane@example.com", name: "Jane" } } },
    } as never);
    expect(mocks.updatePayment).toHaveBeenCalledWith(
      "pay-1",
      expect.objectContaining({ status: "failed", failure_reason: "Your card was declined.", failed_attempts: 1, email: "jane@example.com" }),
      ["pending", "failed"],
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("emails the client a retry link and alerts admins when the checkout closes after a failure", async () => {
    const failed = { ...base, status: "failed", email: "jane@example.com", failure_reason: "Your card was declined.", failed_attempts: 2 };
    mocks.getPayment.mockResolvedValue(failed);
    mocks.updatePayment.mockResolvedValue(failed);
    await handleSessionExpired(session({ payment_status: "unpaid" }));

    const [client, admin] = mocks.sendEmail.mock.calls.map((c) => c[0]);
    expect(client.to.email).toBe("jane@example.com");
    expect(client.text).toContain("https://affordabiz.test/pay?product=new");
    expect(admin.to.email).toBe("owner@affordabiz.test");
    expect(admin.text).toContain("Your card was declined.");
  });

  it("marks an untouched checkout as abandoned without emailing", async () => {
    mocks.updatePayment.mockResolvedValue({ ...base, status: "expired" });
    await handleSessionExpired(session({ payment_status: "unpaid", customer_details: null }));
    expect(mocks.updatePayment).toHaveBeenCalledWith("pay-1", { status: "expired", email: null }, ["pending"]);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

describe("refunds", () => {
  const paid = { ...base, status: "paid", email: "jane@example.com", entry_id: "entry-1", used_at: "2026-11-27T00:00:00Z" };

  it("a full refund takes the webpage offline and alerts admins", async () => {
    mocks.getPaymentByIntent.mockResolvedValue(paid);
    mocks.updatePayment.mockResolvedValue({ ...paid, status: "refunded" });
    mocks.entryUpdate.mockResolvedValue({ data: { id: "entry-1", slug: "jane-doe-tax", business_name: "Jane" }, error: null });
    await handleRefund({ payment_intent: "pi_1", refunded: true, amount: 4699, amount_refunded: 4699, currency: "usd" } as never);

    expect(mocks.updatePayment).toHaveBeenCalledWith("pay-1", expect.objectContaining({ status: "refunded" }), expect.any(Array));
    expect(mocks.sendEmail.mock.calls[0][0].text).toContain("/jane-doe-tax was taken offline");
  });

  it("a partial refund keeps the webpage online", async () => {
    mocks.getPaymentByIntent.mockResolvedValue(paid);
    mocks.updatePayment.mockResolvedValue(paid);
    await handleRefund({ payment_intent: "pi_1", refunded: false, amount: 4699, amount_refunded: 1000, currency: "usd" } as never);
    expect(mocks.updatePayment).toHaveBeenCalledWith("pay-1", { amount_refunded_cents: 1000 });
    expect(mocks.entryUpdate).not.toHaveBeenCalled();
  });
});
