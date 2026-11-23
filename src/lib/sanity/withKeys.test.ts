import { describe, expect, it } from "vitest";
import { withKeys } from "./withKeys";

describe("withKeys", () => {
  it("adds unique _key to objects inside arrays, leaves strings alone", () => {
    const out = withKeys({ items: [{ a: 1 }, { a: 2, sub: [{ b: 1 }] }], tags: ["x"] }) as unknown as {
      items: Array<{ _key: string; a: number; sub: Array<{ _key: string; b: number }> }>;
      tags: string[];
    };
    expect(out.items[0]).toMatchObject({ _key: expect.any(String), a: 1 });
    expect(out.items[0]._key).not.toBe(out.items[1]._key);
    expect(out.items[1].sub[0]).toMatchObject({ _key: expect.any(String), b: 1 });
    expect(out.tags).toEqual(["x"]);
  });
});
