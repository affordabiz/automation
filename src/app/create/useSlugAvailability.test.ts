import { describe, expect, it } from "vitest";
import { localSlugStatus } from "./useSlugAvailability";

describe("localSlugStatus", () => {
  it("is idle for empty input", () => {
    expect(localSlugStatus("")).toEqual({ state: "idle" });
  });
  it("is invalid for bad format or reserved names", () => {
    expect(localSlugStatus("a")?.state).toBe("invalid");
    expect(localSlugStatus("studio")).toEqual({
      state: "invalid",
      message: "This address is reserved — please choose a different one.",
    });
  });
  it("returns null when a server check is needed", () => {
    expect(localSlugStatus("jane-doe")).toBeNull();
  });
});
