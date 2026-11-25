import type { SiteData } from "./types";

/** Sample details shown on each template's preview, matching that template's reference page. */
export function sampleSite(templateNumber: number): SiteData {
  const base: SiteData = {
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
  if (templateNumber === 2) {
    return {
      ...base,
      fullName: "First & Last Name",
      email: "durenstaxsvc@gmail.com",
      phone: "(979) 436-1051",
      servingArea: "Atlanta, GA",
      logoUrl: "/templates/t2/logo-placeholder.png",
      photoUrl: "/templates/t2/jane-doe.webp",
    };
  }
  if (templateNumber === 4) {
    return {
      ...base,
      fullName: "First & Last Name",
      servingArea: "Atlanta, GA",
      logoUrl: "/templates/t4/logo-placeholder.png",
      photoUrl: "/templates/t4/jane-doe.webp",
    };
  }
  if (templateNumber === 3) {
    return {
      ...base,
      fullName: "First & Last Name",
      phone: "(123) 456-7890",
      servingArea: "Atlanta, GA",
      logoUrl: "/templates/t3/logo-placeholder.png",
      photoUrl: "/templates/t3/portrait.png",
    };
  }
  return base;
}
