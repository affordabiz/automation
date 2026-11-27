import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Terms & Conditions | PTIN-Certified Tax Preparer" };

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: [
      "By accessing TaxPrep.me or any contractor page hosted under this domain, you agree to be bound by these Terms and Conditions.",
      "These terms apply to all users, including contractors, affiliates, their clients, and visitors.",
    ],
  },
  {
    heading: "Scope and Contractor Coverage",
    body: [
      "These Terms cover all websites, branded pages, contractor slugs, and affiliate pages hosted on the TaxPrep.me domain. Contractors operating pages under this domain agree that their business activities, clients, and communications through those pages are governed by these Terms.",
    ],
  },
  {
    heading: "Use of the Website",
    body: [
      "You agree not to:",
      {
        list: [
          "Use the site for unlawful purposes",
          "Submit false or misleading information",
          "Attempt to breach security or access restricted areas",
          "Copy content for unauthorized use",
        ],
      },
      "Contractors agree not to misrepresent services or violate tax preparation regulations when using their hosted page.",
    ],
  },
  {
    heading: "Services Provided",
    body: [
      "TaxPrep.me provides website hosting, templates, and operational support for tax preparers. Each contractor or affiliate is independently responsible for:",
      {
        list: [
          "Their tax preparation agreements",
          "Their client relationships",
          "Compliance with IRS rules",
          "Accuracy of tax returns they prepare",
        ],
      },
      "TaxPrep.me is not the tax preparer for contractor clients unless explicitly stated.",
    ],
  },
  {
    heading: "Intellectual Property",
    body: [
      "All content, templates, design elements, and platform features on TaxPrep.me are the property of the site owner. Contractors may use the provided templates only while operating under the TaxPrep.me domain.",
    ],
  },
  {
    heading: "Third Party Links and Partners",
    body: [
      "Some pages may link to banking partners, tax platforms, or third party forms. These parties operate their own policies and terms. TaxPrep.me is not responsible for their content, actions, or policies.",
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      "TaxPrep.me is not liable for:",
      {
        list: [
          "Errors made by contractors in tax preparation",
          "Incorrect financial information provided by clients",
          "Delays caused by IRS or state agencies",
          "Losses arising from user data entry errors",
          "Outages caused by hosting providers or external systems",
        ],
      },
      "Contractors agree to indemnify TaxPrep.me for claims arising from their own tax preparation activities.",
    ],
  },
  {
    heading: "No Guarantee of Outcome",
    body: [
      "Tax outcomes depend entirely on user provided information, IRS regulations, and contractor work. No specific refund amount, approval, or tax result is guaranteed.",
    ],
  },
  { heading: "Termination", body: ["We may suspend or remove contractor pages for any violation of these Terms."] },
  {
    heading: "Changes to Terms",
    body: ["We reserve the right to update these Terms at any time. Continued use of the site means you agree to the updated terms."],
  },
  { heading: "Contact", body: ["For questions regarding these Terms, contact us through the TaxPrep.me site."] },
];

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" sections={SECTIONS} />;
}
