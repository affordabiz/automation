import type { TemplateProps } from "../types";
import { CashAdvance } from "./CashAdvance";
import { ClientForms } from "./ClientForms";
import { Contact, Cta } from "./Contact";
import { Faq } from "./Faq";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Highlights, Intro, Services } from "./Sections";
import type { Variant } from "./variant";

/** Shared page for Templates 6 and 7; the variant sets colours, fonts and layout details. */
export function Layout({ fontClass, v, ...props }: TemplateProps & { v: Variant; fontClass: string }) {
  return (
    <div
      style={v.theme}
      className={`${fontClass} flex min-h-screen flex-col overflow-x-clip bg-white font-(family-name:--x-font-body) text-[15px] text-[#333] antialiased sm:text-base`}
    >
      <Header {...props} />
      <main className="flex-1">
        <Hero {...props} v={v} />
        <Highlights {...props} v={v} />
        <Intro {...props} v={v} />
        <Services {...props} v={v} />
        <Faq {...props} v={v} />
        <ClientForms {...props} v={v} />
        <CashAdvance {...props} />
        <Cta {...props} />
        <Contact {...props} v={v} />
      </main>
    </div>
  );
}
