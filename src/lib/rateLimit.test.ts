import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, clientIp, rateLimit } from "./rateLimit";

beforeEach(() => __resetRateLimits());

describe("rateLimit", () => {
  it("allows up to the limit within the window, then blocks", () => {
    expect(rateLimit("k", 2, 1000, 0)).toBe(true);
    expect(rateLimit("k", 2, 1000, 10)).toBe(true);
    expect(rateLimit("k", 2, 1000, 20)).toBe(false);
  });
  it("frees slots once the window passes", () => {
    rateLimit("k", 1, 1000, 0);
    expect(rateLimit("k", 1, 1000, 1001)).toBe(true);
  });
  it("tracks keys separately", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("b", 1, 1000, 0)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses first x-forwarded-for entry, then x-real-ip, else unknown", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
