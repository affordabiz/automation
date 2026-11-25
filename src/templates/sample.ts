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
  if (templateNumber === 6 || templateNumber === 7) {
    return {
      ...base,
      logoUrl: "/templates/t6/your-logo-here-placeholder.webp",
      photoUrl: "/templates/t6/Graphics-07.webp",
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
  if (templateNumber === 3 || templateNumber === 5) {
    const dir = templateNumber === 5 ? "t5" : "t3";
    return {
      ...base,
      fullName: "First & Last Name",
      phone: "(123) 456-7890",
      servingArea: "Atlanta, GA",
      logoUrl: `/templates/${dir}/logo-placeholder.png`,
      photoUrl: `/templates/${dir}/portrait.png`,
    };
  }
  return base;
}
