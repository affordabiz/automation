import { describe, expect, it } from "vitest";
import { parseInboundItem } from "./inbound";

const token = "1a825d56-029b-4a41-b8e4-61670463431b";
const item = {
  MessageId: "<m1@example.com>",
  From: { Name: "Jane", Address: "Jane@Example.com" },
  To: [{ Name: "Affordabiz", Address: `reply+${token}@reply.example.com` }],
  Recipients: [`reply+${token}@reply.example.com`],
  ExtractedMarkdownMessage: "  Please change my phone number.  ",
  RawTextBody: "quoted text",
  SpamScore: 1,
};

describe("parseInboundItem", () => {
  it("reads a client reply", () => {
    expect(parseInboundItem(item, "reply.example.com")).toEqual({
      token,
      fromEmail: "jane@example.com",
      fromName: "Jane",
      body: "Please change my phone number.",
      messageId: "<m1@example.com>",
    });
  });

  it("falls back to the plain text body", () => {
    const reply = parseInboundItem({ ...item, ExtractedMarkdownMessage: "" }, "reply.example.com");
    expect(reply?.body).toBe("quoted text");
  });

  it("ignores another domain, a malformed token, spam and empty messages", () => {
    expect(parseInboundItem(item, "other.example.com")).toBeNull();
    const badToken = ["reply+not-a-token@reply.example.com"];
    expect(parseInboundItem({ ...item, To: [], Recipients: badToken }, "reply.example.com")).toBeNull();
    expect(parseInboundItem({ ...item, SpamScore: 8 }, "reply.example.com")).toBeNull();
    expect(parseInboundItem({ ...item, Spam: { Score: 9 }, SpamScore: undefined }, "reply.example.com")).toBeNull();
    expect(parseInboundItem({ ...item, ExtractedMarkdownMessage: "", RawTextBody: "" }, "reply.example.com")).toBeNull();
  });
});
