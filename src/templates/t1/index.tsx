import { Inter, Outfit } from "next/font/google";
import type { TemplateProps } from "../types";
import { ClientForms } from "./ClientForms";
import { Contact } from "./Contact";
import { Cta } from "./Cta";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Intro } from "./Intro";
import { Loans } from "./Loans";
import { Services } from "./Services";
import { T1_THEME } from "./theme";

const displayFont = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--t1-font-display" });
const bodyFont = Inter({ subsets: ["latin"], variable: "--t1-font-body" });

export default function TemplateOne(props: TemplateProps) {
  return (
    <div
      style={T1_THEME}
      className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen flex-col overflow-x-clip bg-white font-(family-name:--t1-font-body) text-[15px] text-slate-700 antialiased sm:text-base`}
    >
      <Header {...props} />
      <main className="flex-1">
        <Hero {...props} />
        <Intro {...props} />
        <Services {...props} />
        <Faq {...props} />
        <ClientForms {...props} />
        <Loans {...props} />
        <Cta {...props} />
        <Contact {...props} />
      </main>
      <Footer {...props} />
    </div>
  );
}
