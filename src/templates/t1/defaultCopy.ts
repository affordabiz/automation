import type { TemplateCopy } from "../types";

const CHECKLIST_URL =
  "/files/Tax-Preparation-Client-Checklist.pdf";

/** Verbatim copy from the Template 1 reference page. Do not reword. */
export const T1_DEFAULT_COPY: TemplateCopy = {
  nav: [
    { label: "Home", url: "#home" },
    { label: "About", url: "#about" },
    { label: "Services", url: "#services" },
    { label: "FAQ", url: "#faq" },
    { label: "Client Forms", url: "#forms" },
    { label: "Cash Advance", url: "#cash-advance" },
    { label: "Contact", url: "#contact" },
  ],
  headerButtons: [{ label: "Hiree Video", url: "https://www.taxbizinbox.com/video/" }],
  hero: {
    eyebrow: "$250-$7,500 Cash Advance",
    title: "{{businessName}}",
    subtitle: "{{fullName}}, PTIN-Certified Tax Professional",
    servingLine: "Servicing {{servingArea}}",
    availability: "Mobile & Virtual Service Available",
    ctaLabel: "Learn More",
    badge: "IRS-Certified Tax Professional",
    contactLabel: "Contact Me Today",
    notes: ["Taxes?", "Refunds?", "Need Help?", "Call Us!"],
  },
  highlights: [
    "Small Business & Individual Tax Return Preparation",
    "Quality Services at an Affordable Price",
    "Personalized and Confidential Service",
    "Expert and Up-To-Date Knowledge",
    "Peace of Mind",
    "Convenience with Mobile & Drop-Off Services",
  ],
  highlightsHeading: "Why Us?",
  intro: {
    heading: "Contact our tax professionals today.",
    cards: [
      {
        body: "Be the first to get your refund...get your return in the queue as SOON as you get your tax docs....don't forget the HealthCare.gov form because that will delay your refund if it's not included on your return the first time!",
      },
      {
        body: "Don't try to do your own taxes. In these days of COVID, tax laws are being created to help citizens through the pandemic. Professional help, as well as professional tax software is a MUST to ensure you get the biggest refund the IRS allows.",
      },
      {
        body: "Get an advance on your tax refund fast with free E-Service. Get the option to have your tax prep fee deducted from your refund. Get the best professional tax help that you could require...we are here to help!",
      },
    ],
  },
  services: {
    heading: "My Services",
    ctaLabel: "Book an Appointment",
    items: [
      {
        title: "Tax Return Preparation",
        body: "We specialize in Individual and Small Business tax prep services. We understand the importance of filing your taxes correctly and on time. We offer several options to get started: upload your tax docs on our secure & encrypted automated platform, drop-off service or you can set an appointment.",
      },
      {
        title: "Amended Returns",
        body: "Let us handle any changes you want made to previous returns. You'll feel better - breathe a BIG sigh of relief and feel confident knowing your return(s) have been completed, filed and accepted by the IRS.",
      },
      {
        title: "Delinquent Returns",
        body: "This happens to the best of us... you're not by yourself and many times it's not your fault. However, the reality is this, late returns have have to be filed in order for you to get back into compliance with the IRS.",
      },
    ],
  },
  faq: {
    heading: "FAQ",
    items: [
      {
        question: "Where's My Refund? Where's My Check or Deposit?",
        answer: [
          "- [Check with IRS for Current Year Returns](https://sa.www4.irs.gov/irfof/lang/en/irfofgetstatus.jsp)",
          "- [Check with IRS for Amended Returns](https://www.irs.gov/filing/wheres-my-amended-return)",
          "- [Check with Refund Advantage – (866) 876-6648 or www.TaxPayerInfo.com](https://www.taxpayerinfo.com/)",
        ].join("\n"),
      },
      { question: "What Proof of Identification Will I Need to Provide?", answer: "" },
      {
        question: "What Proof of Income Will I Need to Provide?",
        answer: `[Client Document Checklist](${CHECKLIST_URL})`,
      },
      {
        question: "What Tax Docs Should I Provide?",
        answer: `[Client Document Checklist](${CHECKLIST_URL})`,
      },
      {
        question: "What Docs or Proof Do I Need to Provide for Credits/Deductions?",
        answer: `[Client Document Checklist](${CHECKLIST_URL})`,
      },
      {
        question: "What Forms Do I Need to Get Started/Sign for Compliance?",
        answer: [
          "- [Client Intake form](https://form.jotform.com/70088014642148)",
          "- [EIC Validation form](https://form.jotform.com/70088014642148)",
          "- [Schedule C (Self-Employment) Validation form](https://form.jotform.com/70087171264151)",
          `- [Client Document Checklist](${CHECKLIST_URL})`,
          "",
          "- Bank Product",
          "- Consent Doc",
          "- E-File Signature Authorization",
        ].join("\n"),
      },
    ],
  },
  forms: {
    heading: "Client Forms",
    groups: [
      {
        heading: "Documents That Clients Need To Provide To Tax Professional",
        links: [
          { label: "Client In-Take Form", url: "https://www.taxprep.me/intake/" },
          { label: "Client Document Checklist", url: CHECKLIST_URL },
        ],
      },
      {
        heading: "Compliance Docs For Clients To Sign After Returns Are Completed",
        links: [
          { label: "EIC Validation Form", url: "https://www.taxprep.me/intake/" },
          { label: "Schedule C (Self-Employment) Validation Form", url: "https://www.taxprep.me/intake/" },
        ],
      },
    ],
    portalLink: {
      label: "Client Portal/Upload Tax Docs",
      url: "https://www.taxofficemanagement.com/CustomerPortal/Account/Login",
    },
  },
  loans: {
    heading: "$250-$7,500 Cash Advance",
    subheading: "",
    promoLines: ["Pre-Pack Loans", "Are Here!"],
    promoBadge: "Available Starting January 2",
    // Self-hosted partner logo; clear it in Studio to show a text wordmark instead.
    partnerLogoUrl: "/templates/t1/refund-advantage.jpg",
    partnerName: "Refund Advantage",
    cards: [
      { title: "No-Cost Taxpayer Refund Advance Loans", detail: "Loans of $250, $500, & $1,000" },
      {
        title: "Interest-Bearing Taxpayer Refund Advance Loans",
        detail: "36% APR on loans between $1,250 to $7,500",
      },
    ],
    disclaimers: [
      "The Refund Transfer is an optional tax refund-related product offered by Pathward®, N.A., Member FDIC. The Refund Transfer is not a loan. E-filing of tax return is required to be eligible for the product. Subject to approval. Fees apply. See terms and conditions for details.",
      "The Refund Advance is an optional tax-refund related loan provided by Pathward®, N.A., Member FDIC (it is not the actual tax refund) at participating locations. Program availability and loan amounts may vary based on state and software provider. The amount of the loan and applicable interest will be deducted from tax refunds and reduce the amount that is paid directly to the taxpayer. Fees for other optional products or product features may apply. Tax returns may be filed electronically without applying for this loan. Loans offered in amounts of $250 (where available), $500, $1,000, 25%, 50%, or 75% of your expected tax refund up to $7,500, with interest-based applicants receiving an average of $2,157.45; $7,500 available only to well-qualified applicants with a minimum expected tax refund of $10,592. Underwriting standards subject to change. When calculating the amount of your loan, the amount of your “expected” tax refund may be affected by any refundable tax credits and fees. Loans in the amounts of $250, $500, and $1,000 have an Annual Percentage Rate (APR) of 0.00%. Loans in the amounts of 25%, 50% or 75% of your expected tax refund have an APR of 36.0% with a minimum loan of $1,250. For example, $2,500 loan representing 50% of expected refund borrowed over 33 day term, total amount payable in a single payment is $2,581.37 including interest. Availability is subject to satisfaction of identity verification, eligibility criteria, and underwriting standards.",
      "Certain Refund Advance Loans are available at no cost to tax preparers and taxpayers and Pre-Acknowledgement Loans (approved prior to IRS Acknowledgement) have a $60 or $100 Marketing Fee.",
      "The FasterMoney Visa® Prepaid Card is issued by Pathward®, N.A., Member FDIC.",
    ],
  },
  cta: { heading: "Ready To Get Started?", buttonLabel: "Schedule a Free Consultation" },
  contact: {
    heading: "Contact Us",
    intro: "We'd love to get connected with you about any of my tax services.",
    credentialLine: "{{fullName}}, Certified-PTIN Holder",
  },
  footer: {
    text: "© TaxPrep.me. All rights reserved. This website and all contractor pages hosted under the TaxPrep.me domain are governed by our Privacy Policy and Terms and Conditions. By using this site, you agree to these policies.",
    links: [
      { label: "Privacy Policy", url: "https://www.taxprep.me/privacy-policy-2/" },
      { label: "Terms and Conditions", url: "https://www.taxprep.me/term-condition/" },
    ],
  },
};
