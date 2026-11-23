import { describe, expect, it } from "vitest";
import { toSiteData, type LiveEntryRow } from "./mapping";

const row: LiveEntryRow = {
  id: "entry-1",
  slug: "jane",
  template_number: 1,
  full_name: "Jane",
  business_name: "Biz",
  email: "j@x.com",
  phone: "1",
  address: "A",
  serving_area: "S",
  logo_url: "https://cdn.example/l.png",
  photo_url: "https://cdn.example/p.png",
};

describe("toSiteData", () => {
  it("maps a complete row", () => {
    expect(toSiteData(row)).toEqual({
      id: "entry-1",
      slug: "jane",
      templateNumber: 1,
      fullName: "Jane",
      businessName: "Biz",
      email: "j@x.com",
      phone: "1",
      address: "A",
      servingArea: "S",
      logoUrl: "https://cdn.example/l.png",
      photoUrl: "https://cdn.example/p.png",
    });
  });

  it("uses supplied preview images for an entry that is not public yet", () => {
    const site = toSiteData({ ...row, logo_url: null, photo_url: null }, { logoUrl: "signed-l", photoUrl: "signed-p" });
    expect(site?.logoUrl).toBe("signed-l");
    expect(site?.photoUrl).toBe("signed-p");
  });

  it("rejects rows with missing images or bad template numbers", () => {
    expect(toSiteData({ ...row, logo_url: null })).toBeNull();
    expect(toSiteData({ ...row, template_number: 9 })).toBeNull();
  });
});
