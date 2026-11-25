import { Montserrat, Oswald } from "next/font/google";
import type { TemplateProps } from "../types";
import { CashAdvance } from "./CashAdvance";
import { ClientForms } from "./ClientForms";
import { Contact } from "./Contact";
import { Faq } from "./Faq";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Services } from "./Services";
import { T5_THEME } from "./theme";

const headFont = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--t5-font-head" });
const bodyFont = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--t5-font-body" });

export default function TemplateFive(props: TemplateProps) {
  return (
    <div
      style={T5_THEME}
      className={`${headFont.variable} ${bodyFont.variable} flex min-h-screen flex-col overflow-x-clip bg-white font-(family-name:--t5-font-body) text-[15px] text-[#555] antialiased sm:text-base`}
    >
      <Header {...props} />
      <main className="flex-1">
        <Hero {...props} />
        <Services {...props} />
        <HowItWorks {...props} />
        <ClientForms {...props} />
        <Faq {...props} />
        <CashAdvance {...props} />
        <Contact {...props} />
      </main>
    </div>
  );
}
