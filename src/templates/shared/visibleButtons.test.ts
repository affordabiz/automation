import { describe, expect, it } from "vitest";
import { T1_DEFAULT_COPY } from "../t1/defaultCopy";
import { T2_DEFAULT_COPY } from "../t2/defaultCopy";
import { T3_DEFAULT_COPY } from "../t3/defaultCopy";
import { visibleButtons } from "./buttons";

const url = "https://example.com";

describe("visibleButtons", () => {
  it("never shows a Hiree Signup button, however it is written", () => {
    const shown = visibleButtons([
      { label: "Hiree Video", url },
      { label: "Hiree Signup", url },
      { label: "HIREE SIGNUP", url },
      { label: "Hire SignUp", url },
      { label: "Hiree Sign-Up", url },
    ]);
    expect(shown.map((b) => b.label)).toEqual(["Hiree Video"]);
  });

  it("drops buttons with no label or link", () => {
    expect(visibleButtons([{ label: " ", url }, { label: "Go", url: "" }])).toEqual([]);
  });

  it("no template ships a Hiree Signup button", () => {
    for (const copy of [T1_DEFAULT_COPY, T2_DEFAULT_COPY, T3_DEFAULT_COPY]) {
      expect(copy.headerButtons.some((b) => /sign\s*-?\s*up/i.test(b.label))).toBe(false);
    }
  });
});
