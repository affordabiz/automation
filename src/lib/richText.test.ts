import { describe, expect, it } from "vitest";
import { parseInline, parseRichText } from "./richText";

describe("parseInline", () => {
  it("parses bold and safe links", () => {
    expect(parseInline("See **this** and [IRS](https://irs.gov) now")).toEqual([
      { type: "text", value: "See " },
      { type: "bold", value: "this" },
      { type: "text", value: " and " },
      { type: "link", label: "IRS", href: "https://irs.gov" },
      { type: "text", value: " now" },
    ]);
  });
  it("renders unsafe links as plain text", () => {
    expect(parseInline("[x](javascript:alert)")).toEqual([{ type: "text", value: "x" }]);
  });
});

describe("parseRichText", () => {
  it("groups paragraphs and bullet lists", () => {
    const blocks = parseRichText("Line one\nline two\n\n- a\n- **b**\nAfter");
    expect(blocks).toEqual([
      { type: "p", content: [{ type: "text", value: "Line one line two" }] },
      { type: "ul", items: [[{ type: "text", value: "a" }], [{ type: "bold", value: "b" }]] },
      { type: "p", content: [{ type: "text", value: "After" }] },
    ]);
  });
  it("returns no blocks for empty text", () => {
    expect(parseRichText("  \n ")).toEqual([]);
  });
});
