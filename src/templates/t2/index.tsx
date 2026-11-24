import { DM_Sans, Darker_Grotesque } from "next/font/google";
import type { TemplateProps } from "../types";
import { About } from "./About";
import { ClientForms } from "./ClientForms";
import { Contact } from "./Contact";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Loans } from "./Loans";
import { T2_THEME } from "./theme";
import { WhyUs } from "./WhyUs";

const displayFont = Darker_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--t2-font-display" });
const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--t2-font-body" });

export default function TemplateTwo(props: TemplateProps) {
  return (
    <div
      style={T2_THEME}
      className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen flex-col overflow-x-clip bg-(--t2-cream) font-(family-name:--t2-font-body) text-[15px] text-slate-700 antialiased sm:text-base`}
    >
      <Header {...props} />
      <main className="flex-1">
        <Hero {...props} />
        <About {...props} />
        <Features {...props} />
        <WhyUs {...props} />
        <ClientForms {...props} />
        <Faq {...props} />
        <Loans {...props} />
        <Contact {...props} />
      </main>
      <Footer {...props} />
    </div>
  );
}
