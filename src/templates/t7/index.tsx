import { Oswald, Poppins } from "next/font/google";
import { Layout } from "../t6/Layout";
import { T7_VARIANT } from "../t6/variant";
import type { TemplateProps } from "../types";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--x-font-head" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--x-font-body" });

export default function TemplateSeven(props: TemplateProps) {
  return <Layout {...props} v={T7_VARIANT} fontClass={`${oswald.variable} ${poppins.variable}`} />;
}
