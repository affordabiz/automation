import type { SiteData } from "./types";

export function sampleSite(templateNumber: number): SiteData {
  return {
    id: null,
    slug: null,
    templateNumber,
    fullName: "Jane Doe",
    businessName: "Jane Doe Tax Service",
    email: "janedoetaxes@gmail.com",
    phone: "(404) 111-2222",
    address: "Atlanta, GA",
    servingArea: "Atlanta & Surrounding States",
    logoUrl: "/samples/logo-icon.svg",
    photoUrl: "/templates/t1/professional.jpg",
  };
}
