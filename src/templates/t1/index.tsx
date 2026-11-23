import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
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

const displayFont = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--t1-font-display" });
const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--t1-font-body" });

export default function TemplateOne(props: TemplateProps) {
  return (
    <div
      style={T1_THEME}
      className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen flex-col bg-white font-(family-name:--t1-font-body) text-slate-800`}
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
