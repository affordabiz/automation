import { Poppins } from "next/font/google";
import type { TemplateProps } from "../types";
import { Layout } from "./Layout";
import { T6_VARIANT } from "./variant";

/** Template 6 uses Poppins for headings and body; the variant points the heading font at it. */
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--x-font-body" });

export default function TemplateSix(props: TemplateProps) {
  return <Layout {...props} v={T6_VARIANT} fontClass={poppins.variable} />;
}
