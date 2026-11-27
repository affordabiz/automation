import type { Metadata } from "next";
import { GET_STARTED_HERE, GetStartedPage } from "@/components/site/GetStartedPage";

export const metadata: Metadata = { title: "Free-Quote | PTIN-Certified Tax Preparer" };

export default function Page() {
  return <GetStartedPage v={GET_STARTED_HERE} />;
}
