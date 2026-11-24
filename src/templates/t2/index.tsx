import { Darker_Grotesque, Open_Sans, Roboto_Slab, Source_Sans_3 } from "next/font/google";
import type { TemplateProps } from "../types";
import { About } from "./About";
import { ClientForms } from "./ClientForms";
import { Contact } from "./Contact";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Loans } from "./Loans";
import { T2_THEME } from "./theme";

const displayFont = Darker_Grotesque({ subsets: ["latin"], weight: ["500", "600", "700", "800", "900"], variable: "--t2-font-display" });
const slabFont = Roboto_Slab({ subsets: ["latin"], weight: ["400", "700"], variable: "--t2-font-slab" });
const navFont = Source_Sans_3({ subsets: ["latin"], weight: ["700"], variable: "--t2-font-nav" });
const openFont = Open_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--t2-font-open" });

export default function TemplateTwo(props: TemplateProps) {
  return (
    <div
      style={T2_THEME}
      className={`${displayFont.variable} ${slabFont.variable} ${navFont.variable} ${openFont.variable} flex min-h-screen flex-col overflow-x-clip bg-white font-(family-name:--t2-font-display) text-[17px] font-semibold text-[#666] antialiased sm:text-lg`}
    >
      <Header {...props} />
      <main className="flex-1">
        <Hero {...props} />
        <About {...props} />
        <Features {...props} />
        <ClientForms {...props} />
        <Faq {...props} />
        <Loans {...props} />
        <Contact {...props} />
      </main>
    </div>
  );
}
