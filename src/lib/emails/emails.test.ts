import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escape";
import { siteReadyEmail } from "./siteReady";
import { contactMessageEmail } from "./contactMessage";

describe("emails", () => {
  it("escapes html", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
  it("site ready email contains link and business name", () => {
    const e = siteReadyEmail({ fullName: "Jane", businessName: "Jane <Tax>", url: "https://x.com/jane" });
    expect(e.subject).toBe("Your webpage is ready — Jane <Tax>");
    expect(e.html).toContain('href="https://x.com/jane"');
    expect(e.html).toContain("Jane &lt;Tax&gt;");
    expect(e.text).toContain("https://x.com/jane");
  });
  it("contact email escapes visitor input and keeps line breaks", () => {
    const e = contactMessageEmail({
      businessName: "Biz", name: "<b>Bob</b>", email: "b@x.com", phone: "", message: "Line1\nLine2", pageUrl: "https://x.com/biz",
    });
    expect(e.subject).toBe("New enquiry from <b>Bob</b> via your website");
    expect(e.html).toContain("&lt;b&gt;Bob&lt;/b&gt;");
    expect(e.html).toContain("Line1<br>Line2");
    expect(e.text).toContain("Phone: —");
  });
});
