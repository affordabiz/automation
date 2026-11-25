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
  intro: {
    heading: string;
    /** Line under the heading (Template 3 "Contact Our Tax Professionals Today!"). */
    subheading?: string;
    ctaLabel?: string;
    cards: { title?: string; body: string }[];
  };
  services: { heading: string; ctaLabel: string; items: { title: string; body: string }[] };
  faq: { heading: string; ctaLabel?: string; items: { question: string; answer: string }[] };
  /** Template 3 hero booking form. */
  booking?: { heading: string };
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
  contact: {
    heading: string;
    intro: string;
    credentialLine: string;
    /** Template 3 info headings: specialty, about, phone/email, service area. */
    infoHeadings?: string[];
    /** Templates 6–7 area line in the contact block, e.g. "Serving {{servingArea}}". */
    servingLine?: string;
  };
  footer: { text: string; links: LinkItem[] };
}

export interface TemplateProps {
  site: SiteData;
  copy: TemplateCopy;
}
