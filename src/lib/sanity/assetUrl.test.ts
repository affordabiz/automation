import { describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({ projectId: "proj", dataset: "production" }));

import { assetUrl, isSanityAssetId } from "./assetUrl";

describe("assetUrl", () => {
  it("builds image URLs", () => {
    expect(assetUrl("image-abc123-640x480-png")).toBe("https://cdn.sanity.io/images/proj/production/abc123-640x480.png");
  });

  it("builds file URLs", () => {
    expect(assetUrl("file-abc123-pdf")).toBe("https://cdn.sanity.io/files/proj/production/abc123.pdf");
  });

  it("rejects storage paths from the previous provider", () => {
    expect(isSanityAssetId("11111111/logo-abc.png")).toBe(false);
    expect(() => assetUrl("11111111/logo-abc.png")).toThrow();
  });
});
