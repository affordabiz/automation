import type { Metadata } from "next";
import { GETSTARTED, GetStartedPage } from "@/components/site/GetStartedPage";

export const metadata: Metadata = { title: "Free-Quote | PTIN-Certified Tax Preparer" };

export default function Page() {
  return <GetStartedPage v={GETSTARTED} />;
}
