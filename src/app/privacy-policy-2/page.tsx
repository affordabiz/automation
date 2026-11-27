import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | PTIN-Certified Tax Preparer" };

const SECTIONS: LegalSection[] = [
  {
    heading: "Introduction",
    body: [
      "This Privacy Policy describes how TaxPrep.me collects, uses, stores, and protects information from users of this website. This policy applies to all websites, pages, contractor sites, and branded subpages or slugs hosted under the TaxPrep.me domain. Any contractor, affiliate, or preparer using a hosted page under TaxPrep.me agrees that their visitors, leads, and clients are covered by this Privacy Policy.",
      "By using this site, you consent to the practices described in this Privacy Policy.",
    ],
  },
  {
    heading: "Information We Collect",
    body: [
      "We may collect the following types of information:",
      {
        label: "Personal Information",
        list: [
          "Name",
          "Phone number",
          "Email address",
          "Mailing address",
          "Tax documents provided by you",
          "Identification documents",
          "Information required for tax preparation",
        ],
      },
      {
        label: "Automatically Collected Information",
        list: [
          "IP address",
          "Device type",
          "Browser type",
          "Cookies and tracking technologies",
          "Usage data related to pages visited and time spent",
        ],
      },
      {
        label: "Financial Information",
        list: [
          "Bank account information when required for tax preparation or bank product applications",
          "Information needed for refunds, advances, or direct deposit services",
        ],
      },
    ],
  },
  {
    heading: "How We Use Your Information",
    body: [
      "We use your information for the following purposes:",
      {
        list: [
          "Preparing and filing tax returns",
          "Communicating with you regarding your services",
          "Verifying identity and compliance",
          "Processing payments or refunds",
          "Providing customer support",
          "Maintaining, improving, or customizing contractor pages under TaxPrep.me",
          "Meeting legal, regulatory, and security obligations",
        ],
      },
    ],
  },
  {
    heading: "How We Share Information",
    body: [
      "We may share your information with:",
      {
        list: [
          "Trusted tax preparers operating under the TaxPrep.me network",
          "Bank product partners",
          "IRS and state taxing authorities",
          "Third party vendors who assist in tax preparation",
          "Compliance and fraud prevention partners",
          "Service providers who maintain our site and systems",
        ],
      },
      "We do not sell your personal information.",
    ],
  },
  {
    heading: "Contractor Pages and Affiliate Sites",
    body: [
      "Any contractor or affiliated tax preparer operating a page or branded slug under TaxPrep.me uses this Privacy Policy. Visitors who submit information through those pages are subject to this policy, regardless of the contractor’s business name.",
    ],
  },
  {
    heading: "Data Protection",
    body: [
      "We use administrative, technical, and physical security measures to protect your information. Although no method of transmission or storage is fully secure, we strive to protect your data to the highest standards required by federal and state law.",
    ],
  },
  {
    heading: "Your Rights",
    body: [
      "You may request:",
      {
        list: [
          "Access to your personal data",
          "Correction of inaccurate information",
          "Deletion where legally permitted",
          "Limitations on certain data uses",
        ],
      },
      "Requests may be submitted through the contact page on TaxPrep.me.",
    ],
  },
  {
    heading: "Cookies and Tracking",
    body: [
      "We may use cookies and tracking tools to enhance your user experience and improve site performance. You may disable cookies through your browser settings.",
    ],
  },
  { heading: "Children’s Privacy", body: ["We do not knowingly collect information from anyone under age thirteen."] },
  {
    heading: "Changes to This Policy",
    body: ["We may update this Privacy Policy at any time. Continued use of this site means you accept the updated terms."],
  },
  { heading: "Contact Us", body: ["For questions regarding your privacy, contact us through the TaxPrep.me site."] },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" sections={SECTIONS} />;
}
