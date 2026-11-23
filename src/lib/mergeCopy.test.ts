import { describe, expect, it } from "vitest";
import { mergeCopy } from "./mergeCopy";

const base = { title: "Base", list: ["a"], nested: { x: "1", y: "2" } };

describe("mergeCopy", () => {
  it("returns base for null/undefined override", () => {
    expect(mergeCopy(base, null)).toBe(base);
  });
  it("overrides non-empty strings and non-empty arrays", () => {
    expect(mergeCopy(base, { title: "CMS", list: ["b", "c"], nested: { y: "9" } })).toEqual({
      title: "CMS", list: ["b", "c"], nested: { x: "1", y: "9" },
    });
  });
  it("keeps base for empty strings/arrays and wrong types, ignores extra keys", () => {
    expect(mergeCopy(base, { title: "  ", list: [], nested: "oops", _type: "copy" })).toEqual(base);
  });
});
