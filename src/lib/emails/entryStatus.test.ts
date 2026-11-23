import { describe, expect, it } from "vitest";
import { entryReceivedEmail, entryRejectedEmail } from "./entryStatus";

describe("entry status emails", () => {
  it("tells the client their request is under review", () => {
    const email = entryReceivedEmail({ fullName: "Jane", businessName: "Jane Tax" });
    expect(email.subject).toBe("We received your request — Jane Tax");
    expect(email.text).toContain("Once it's approved");
  });

  it("includes the rejection reason and escapes it", () => {
    const email = entryRejectedEmail({ fullName: "Jane", businessName: "A&B", reason: "Bad <logo>\nPlease retry" });
    expect(email.html).toContain("A&amp;B");
    expect(email.html).toContain("Bad &lt;logo&gt;<br>Please retry");
    expect(email.text).toContain("Bad <logo>");
  });
});
