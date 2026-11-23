import { describe, expect, it } from "vitest";
import { TEMPLATE_CATALOG, getTemplateMeta, isLiveTemplate } from "./catalog";
import { getDefaultCopy } from "./defaults";

describe("catalog", () => {
  it("has 7 templates numbered 1..7", () => {
    expect(TEMPLATE_CATALOG.map((t) => t.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("only template 1 is live in v1", () => {
    expect(isLiveTemplate(1)).toBe(true);
    expect(isLiveTemplate(2)).toBe(false);
    expect(isLiveTemplate(99)).toBe(false);
    expect(getTemplateMeta(1)?.name).toBe("Classic Tax Pro");
  });
  it("every live template has default copy", () => {
    for (const t of TEMPLATE_CATALOG.filter((t) => t.status === "live")) {
      expect(getDefaultCopy(t.number)).not.toBeNull();
    }
  });
});
