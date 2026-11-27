import type { Metadata } from "next";
import { ClientFormsPage } from "@/components/site/ClientFormsPage";

export const metadata: Metadata = { title: "Client In-Take Form | PTIN-Certified Tax Preparer" };

export default function IntakePage() {
  return <ClientFormsPage variant="intake" />;
}
