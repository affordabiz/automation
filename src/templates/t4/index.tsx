import { Open_Sans, Roboto_Slab, Source_Sans_3 } from "next/font/google";
import type { TemplateProps } from "../types";
import { About } from "./About";
import { ClientForms } from "./ClientForms";
import { Contact } from "./Contact";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Loans } from "./Loans";
import { T4_THEME } from "./theme";

const slabFont = Roboto_Slab({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--t4-font-slab" });
const navFont = Source_Sans_3({ subsets: ["latin"], weight: ["700"], variable: "--t4-font-nav" });
const openFont = Open_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--t4-font-open" });

export default function TemplateFour(props: TemplateProps) {
  return (
    <div
      style={T4_THEME}
      className={`${slabFont.variable} ${navFont.variable} ${openFont.variable} flex min-h-screen flex-col overflow-x-clip bg-white font-(family-name:--t4-font-slab) text-base font-light text-[#333] antialiased`}
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
