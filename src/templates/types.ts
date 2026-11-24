export interface LinkItem {
  label: string;
  url: string;
}

export interface SiteData {
  /** Entry id, null for previews */
  id: string | null;
  /** null for previews (contact form disabled) */
  slug: string | null;
  templateNumber: number;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  servingArea: string;
  logoUrl: string;
  photoUrl: string;
}

export interface TemplateCopy {
  nav: LinkItem[];
  headerButtons: LinkItem[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    servingLine: string;
    availability: string;
    ctaLabel: string;
    badge: string;
    contactLabel: string;
    notes: string[];
  };
  highlights: string[];
  /** Heading above the highlights list (Template 2 "Why Us?"). */
  highlightsHeading: string;
  intro: { heading: string; cards: { body: string }[] };
  services: { heading: string; ctaLabel: string; items: { title: string; body: string }[] };
  faq: { heading: string; items: { question: string; answer: string }[] };
  forms: {
    heading: string;
    groups: { heading: string; links: LinkItem[] }[];
    portalLink: LinkItem;
  };
  loans: {
    heading: string;
    subheading: string;
    promoLines: string[];
    promoBadge: string;
    partnerLogoUrl: string;
    partnerName: string;
    cards: { title: string; detail: string }[];
    disclaimers: string[];
  };
  cta: { heading: string; buttonLabel: string };
  contact: { heading: string; intro: string; credentialLine: string };
  footer: { text: string; links: LinkItem[] };
}

export interface TemplateProps {
  site: SiteData;
  copy: TemplateCopy;
}
