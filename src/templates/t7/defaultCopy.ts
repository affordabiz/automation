import {
  CHECKLIST,
  COMPLIANCE,
  CREDITS,
  DISCLAIMERS,
  FOOTER,
  FORMS,
  HIGHLIGHTS,
  ID_PROOF,
  INTRO_CARDS,
  LOAN_CARDS,
  PAYSTUB_POINTS,
  REFUND_LINKS,
  SERVICES,
  TAX_DOCS,
} from "../t6/defaultCopy";
import type { TemplateCopy } from "../types";

const INCOME = [
  CHECKLIST,
  "",
  "**Income can be in the form of W2s and 1099s. You will oftentimes have several and all will need to be provided to your tax professional. Please note that taxpayers cannot use the last paycheck stub to file since it is in direct violation of IRS policy.**",
  "",
  ...PAYSTUB_POINTS,
].join("\n");

/**
 * Verbatim copy from the Template 7 reference page (taxprep.me/template-7). Do not reword —
 * including the reference's numbered questions ("1 : ", "2: ", "5 :").
 */
export const T7_DEFAULT_COPY: TemplateCopy = {
  nav: [],
  // "Hiree Sign Up" from the reference is intentionally left out on every template.
  headerButtons: [{ label: "Hiree Video", url: "https://www.taxbizinbox.com/video/" }],
  hero: {
    eyebrow: "",
    title: "{{businessName}}",
    subtitle: "{{fullName}}, PTIN-Certified Tax Preparer",
    servingLine: "Servicing {{servingArea}}",
    availability: "Mobile & Virtual Service Available",
    ctaLabel: "Learn More",
    badge: "",
    contactLabel: "",
    notes: [],
  },
  highlights: HIGHLIGHTS,
  highlightsHeading: "",
  intro: { heading: "Contact our tax professionals today", ctaLabel: "Book an Appointment", cards: INTRO_CARDS },
  services: { heading: "My Services", ctaLabel: "", items: SERVICES },
  faq: {
    heading: "Frequently Asked Questions",
    items: [
      { question: "1 : Where's My Refund? Where's My Check or Deposit?", answer: REFUND_LINKS },
      { question: "2: What Proof of Identification Will I Need to Provide?", answer: ID_PROOF },
      { question: "3 : What Proof of Income Will I Need to Provide?", answer: INCOME },
      { question: "4 : What Tax Docs Should I Provide?", answer: TAX_DOCS },
      { question: "5 :What Docs or Proof Do I Need to Provide for Credits/Deductions?", answer: CREDITS },
      { question: "6 :What Forms Do I Need to Get Started/Sign for Compliance?", answer: COMPLIANCE },
    ],
  },
  forms: FORMS,
  loans: {
    heading: "",
    subheading: "",
    promoLines: [],
    promoBadge: "",
    partnerLogoUrl: "/templates/t6/Refund-ADvantage.webp",
    partnerName: "Refund Advantage",
    cards: LOAN_CARDS,
    disclaimers: DISCLAIMERS,
  },
  cta: { heading: "", buttonLabel: "" },
  contact: {
    heading: "Contact Us",
    intro: "We’d love to get connected with you about any of our tax services.",
    credentialLine: "{{fullName}}, Certified-PTIN Holder",
    servingLine: "Serving {{servingArea}}",
  },
  footer: FOOTER,
};
