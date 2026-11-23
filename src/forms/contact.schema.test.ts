import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact.schema";

describe("contactSchema", () => {
  it("accepts a valid message and defaults phone", () => {
    const r = contactSchema.safeParse({ name: " Bob ", email: "b@x.com", message: "Hi" });
    expect(r.success && r.data).toEqual({ name: "Bob", email: "b@x.com", phone: "", message: "Hi" });
  });
  it("rejects empty message and bad email", () => {
    const r = contactSchema.safeParse({ name: "Bob", email: "x", message: " " });
    expect(r.success).toBe(false);
  });
});
