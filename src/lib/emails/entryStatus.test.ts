import { describe, expect, it } from "vitest";
import { entryMessageEmail, entryReceivedEmail } from "./entryStatus";

describe("entry emails", () => {
  it("tells the client their request is under review", () => {
    const email = entryReceivedEmail({ fullName: "Jane", businessName: "Jane Tax" });
    expect(email.subject).toBe("We received your request — Jane Tax");
    expect(email.text).toContain("Once it's approved");
  });

  it("escapes admin messages and keeps line breaks", () => {
    const email = entryMessageEmail({ fullName: "Jane", businessName: "A&B", message: "Bad <logo>\nPlease retry" });
    expect(email.subject).toBe("A message about your webpage — A&B");
    expect(email.html).toContain("Bad &lt;logo&gt;<br>Please retry");
    expect(email.text).toContain("Bad <logo>");
  });
});
