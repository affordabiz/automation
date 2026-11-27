import type { TemplateCopy } from "../types";

const CHECKLIST_URL =
  "/files/Tax-Preparation-Client-Checklist.pdf";
const CHECKLIST = `[Client Document Checklist](${CHECKLIST_URL})`;

const DEDUCTIONS = [
  "- Child Care Expenses",
  "- 1098-T Education Tuition Expense",
  "- Interest Paid on Student Loans",
  "- Alimony Paid (need Social Security number of recipient)",
  "- 1098 – Mortgage Interest Expense",
  "- Medical savings account",
  "- Moving expenses",
  "- IRA contributions",
  "- Rental Property Expense & cost basis",
  "- Adoption expenses",
  "- Medical Expenses (Health Care – Prescriptions, Doctors, Dentists, Eyeglasses, Medical Insurance, Long Term Health Care Insurance)",
  "- Real Estate Taxes and other taxes paid",
  "- List of Charitable Contributions",
  "- Un-Reimbursed Job Expense",
  "- Union/Professional Dues, Job related educational costs, Investment expenses, Job Search expense, Hobby expense, Work uniforms, Safe deposit box",
];

const HIGHLIGHTS = [
  "Small Business & Individual Tax Return Preparation",
  "Quality Services at an Affordable Price",
  "Personalized and Confidential Service",
  "Expert and Up-To-Date Knowledge",
  "Peace of Mind",
  "Convenience with Mobile & Drop-Off Services",
];

/**
 * Verbatim copy from the Template 5 reference page (taxprep.me/template-5). Do not reword —
 * including the reference's own spellings ("o fthe Form -2", "correspondance", "More INfo").
 */
export const T5_DEFAULT_COPY: TemplateCopy = {
  nav: [
    { label: "Home", url: "#home" },
    { label: "What We Offer", url: "#services" },
    { label: "How It Works", url: "#about" },
    { label: "Client Forms", url: "#forms" },
    { label: "FAQ", url: "#faq" },
    { label: "Cash Advance", url: "#cash-advance" },
    { label: "Get In Touch", url: "#contact" },
  ],
  // "Hiree Signup" from the reference is intentionally left out on every template.
  headerButtons: [{ label: "Hiree Video", url: "https://taxbizinbox.com/video/" }],
  hero: {
    eyebrow: "",
    title: "{{businessName}}",
    subtitle: "{{fullName}}, PTIN-Certified Tax Professional",
    servingLine: "{{servingArea}}",
    availability: "",
    ctaLabel: "",
    badge: "PTIN Certified Tax Professional",
    contactLabel: "Send An Email",
    notes: [],
  },
  highlights: HIGHLIGHTS,
  highlightsHeading: "Our Specialty",
  booking: { heading: "Schedule A Free Consultation" },
  services: {
    heading: "What We Offer",
    ctaLabel: "Learn More",
    items: [
      {
        title: "Tax Return Preparation",
        body: "We specialize in Individual and Small Businesses tax prep services. We understand the importance of filing your taxes correctly and on time. We offer several options to get started: upload your tax docs on our secure & encrypted automated platform, drop-off service or you can set an appointment.",
      },
      {
        title: "Amended Returns",
        body: "Let us handle any changes you want made to previous returns. You’ll feel better – breathe a BIG sigh of relief and feel confident knowing your return(s) have been completed, filed and accepted by the IRS.",
      },
      {
        title: "Delinquent Returns",
        body: "This happens to the best of us… you’re not by yourself and many times it’s not your fault. However, the reality is this, late returns have have to be filed in order for you to get back into compliance with the IRS.",
      },
    ],
  },
  intro: {
    heading: "How It Works",
    subheading: "Contact Our Tax Professionals Today!",
    ctaLabel: "More INfo",
    cards: [
      {
        title: "Be the first to get your refund",
        body: "Be the first to get your refund…get your return in the queue as SOON as you get your tax docs…don’t forget the HealthCare.gov form because that will delay your refund if it’s not included on your return the first time!",
      },
      {
        title: "Don’t try to do your own taxes",
        body: "Don’t try to do your own taxes. In these days of COVID, tax laws are being created to help citizens through the pandemic. Professional help, as well as professional tax software is a MUST to ensure you get the biggest refund the IRS allows.",
      },
      {
        title: "Get your refund fast",
        body: "Get an advance on your tax refund fast with free E-Service. Get the option to have your tax prep fee deducted from your refund. Get the best professional tax help that you could require…we are here to help!",
      },
    ],
  },
  faq: {
    heading: "Frequently Asked Questions",
    ctaLabel: "Get In Touch",
    items: [
      {
        question: "Where's My Refund? Where's My Check or Deposit?",
        answer: [
          "- [Check with IRS for Current Year Returns](https://sa.www4.irs.gov/irfof/lang/en/irfofgetstatus.jsp)Here are the links to check your refund status:",
          "- [Check with IRS for Amended Returns](https://www.irs.gov/filing/wheres-my-amended-return)",
          "- [Check with Refund Advantage – (866) 876-6648 or www.TaxPayerInfo.com](https://www.taxpayerinfo.com/)",
        ].join("\n"),
      },
      {
        question: "What Proof of Identification Will I Need to Provide?",
        answer: [
          "- State-Issued or Federal-Issued picture ID",
          "- Social Security Cards for everyone yourself and spouse/dependents (if applicable)",
          "- Your Checking Account & Routing Number (to direct deposit your refund) or we can print a check (where available)",
          "- Copy of your previous or most recently filed tax return",
        ].join("\n"),
      },
      {
        question: "What Proof of Income Will I Need to Provide?",
        answer: [
          `- ${CHECKLIST}`,
          "- **No, taxpayers cannot use the last paycheck stub to file since it is in direct violation of IRS policy.**",
          "- W-2s differ for many events, including (but not limited to) benefits, such as cafeteria plan or insurance [non-medical] or deferred compensation or savings plan, such as 401(k), 403(b) or the like.",
          "- **Using your check stub instead o fthe Form -2 can cause tax overpayment, refund delay & an audit/inquiry correspondance trigger.**",
          "- **Companies file W-2s and 1099s with the IRS, so make sure yours match up.**",
          "- **Call your H.R. department to see if your company uses W-2 importing platform.**",
          "",
          "**Go to IRS Website to Request a transcript of income that has been reported under your SSN.**",
          "",
          "**Not all will apply.**",
          "",
          "- **W-2 for you & spouse**",
          "- **Form 1099 and Form 1099-MISC for self-employment income**",
          "- **Form 1099-A for foreclosure of a home**",
          "- **Form 1099-B for proceeds from broker transactions**",
          "- **Form 1099-C for cancellation of debt**",
          "- **Form 1099-DIV for dividends and distributions**",
          "- **Form 1099-G for unemployment income or a state tax refund**",
          "- **Form 1099-INT or Form 1099-OID for interest income**",
          "- **Form 1099-K for business or rental income processed by third-party networks**",
          "- **Form 1099-LTC for Long Term Care reimbursements**",
          "- **Form 1099-PATR for patronage dividends**",
          "- **Form 1099-Q for payments from qualified education programs**",
          "- **Form 1099-QA for distributions from an ABLE account**",
          "- **Form 1099-S proceeds from the sales of property**",
          "- **Form 1099-SA for Health Savings Account and Medical Savings Account distributions**",
          "- **Form SSA-1099 for Social Security benefits**",
          "- **Form RRB-1099 for railroad retirement benefits**",
          "- **Alimony or Child Support received**",
          "- **Gambling income and losses**",
          "- **Cost Basis of Securities Sold**",
          "- **For Small Business Owners – bank statements, complete the Schedule C Validation Form, a Profit & Loss Statement, contractors letter of engagement, summary of income and expenses, records of gross receipts and revenue, business license**",
        ].join("\n"),
      },
      {
        question: "What Tax Docs Should I Provide?",
        answer: [
          `- ${CHECKLIST}`,
          "- Provide all documents mailed to you which indicate they’re for “Tax Purposes.” **Not all will apply.**",
          "",
          ...DEDUCTIONS,
        ].join("\n"),
      },
      {
        question: "What Docs or Proof Do I Need to Provide for Credits/Deduction?",
        answer: [CHECKLIST, "", "Not all will apply.", "", ...DEDUCTIONS].join("\n"),
      },
      {
        question: "What Forms Do I Need to Get Started/Sign for Compliance?",
        answer: [
          "Here are the forms that you need to submit BEFORE your return is complete:",
          "",
          "- [Client Intake form](https://form.jotform.com/70088014642148)",
          "- [EIC Validation form](https://form.jotform.com/70088014642148)",
          "- [Schedule C (Self-Employment) Validation form](https://form.jotform.com/70087171264151)",
          `- ${CHECKLIST}`,
          "",
          "Here are the forms that you need to submit AFTER your return is complete and prior to filing (generated in tax software):",
          "",
          "- Bank Product (provides consent to have your tax prep fee deducted from your refund and/or apply for a cash advance)",
          "- Consent Doc (provides consent for tax preparer to use the information you provided for the purpose of preparing your return)",
          "- E-File Signature Authorization – provide consent for your tax preparer to E-File your tax return",
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
          { label: "CLIENT IN-TAKE FORM", url: "https://www.taxprep.me/intake?=998" },
          { label: "Client Document Checklist", url: CHECKLIST_URL },
        ],
      },
      {
        heading: "Compliance Docs For Clients To Sign After Returns Are Completed",
        links: [
          { label: "EIC VALIDATION FORM", url: "https://form.jotform.com/70088014642148" },
          { label: "SCHEDULE C (SELF-EMPLOYMENT) VALIDATION FORM", url: "https://form.jotform.com/70087171264151" },
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
    subheading: "Taxpayer Advance Loans are here! Available Starting January 2!",
    promoLines: [],
    promoBadge: "",
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
  cta: { heading: "", buttonLabel: "" },
  contact: {
    heading: "Email Us",
    intro: "",
    credentialLine: "PTIN Certified Tax Professional",
    infoHeadings: ["Our Specialty", "I’m Here to Help", "Get in Touch", "Service Area"],
  },
  footer: {
    text: "© TaxPrep.me. All rights reserved. This website and all contractor pages hosted under the TaxPrep.me domain are governed by our Privacy Policy and Terms and Conditions. By using this site, you agree to these policies.",
    links: [
      { label: "Privacy Policy", url: "https://www.taxprep.me/privacy-policy-2/" },
      { label: "Terms and Conditions", url: "https://www.taxprep.me/term-condition/" },
    ],
  },
};
