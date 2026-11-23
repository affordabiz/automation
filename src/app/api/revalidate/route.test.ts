import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ parseBody: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next-sanity/webhook", () => ({ parseBody: mocks.parseBody }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import { POST } from "./route";

const req = () => new Request("http://localhost/api/revalidate", { method: "POST", body: "{}" });

beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

describe("POST /api/revalidate", () => {
  it("401 on bad signature", async () => {
    mocks.parseBody.mockResolvedValue({ isValidSignature: false, body: null });
    expect((await POST(req() as never)).status).toBe(401);
  });
  it("expires the site tag", async () => {
    mocks.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: "site", slug: "jane" } });
    expect((await POST(req() as never)).status).toBe(200);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("site:jane", { expire: 0 });
  });
  it("expires the templates tag", async () => {
    mocks.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: "template" } });
    await POST(req() as never);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("templates", { expire: 0 });
  });
});
