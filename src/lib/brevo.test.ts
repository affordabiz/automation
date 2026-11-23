import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./brevo";

const msg = { to: { email: "o@x.com", name: "Owner" }, subject: "S", html: "<p>h</p>", text: "t", replyTo: { email: "v@x.com" } };

beforeEach(() => {
  vi.stubEnv("BREVO_API_KEY", "key");
  vi.stubEnv("BREVO_SENDER_EMAIL", "noreply@affordabiz.com");
  vi.stubEnv("BREVO_SENDER_NAME", "Affordabiz");
  vi.stubEnv("BREVO_DRY_RUN", "");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("sendEmail", () => {
  it("posts the Brevo payload with api-key header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "m1" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(msg)).toEqual({ ok: true, messageId: "m1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.headers["api-key"]).toBe("key");
    expect(JSON.parse(init.body)).toEqual({
      sender: { email: "noreply@affordabiz.com", name: "Affordabiz" },
      to: [{ email: "o@x.com", name: "Owner" }],
      subject: "S", htmlContent: "<p>h</p>", textContent: "t", replyTo: { email: "v@x.com" },
    });
  });
  it("returns ok:false on non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));
    const r = await sendEmail(msg);
    expect(r.ok).toBe(false);
  });
  it("returns ok:false when not configured", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    expect((await sendEmail(msg)).ok).toBe(false);
  });
  it.each(["1", "true", "TRUE"])("dry-run (%s) never calls fetch", async (flag) => {
    vi.stubEnv("BREVO_DRY_RUN", flag);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    expect((await sendEmail(msg)).ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    info.mockRestore();
  });
});
