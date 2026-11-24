import type { TemplateProps } from "../types";
import { btnNavy, container, display, externalProps, h2 } from "./theme";

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className="scroll-mt-24 bg-white pb-16 lg:pb-20">
      <div className={container}>
        <div className="bg-(--t2-mint) px-5 pt-10 pb-12 sm:px-10 lg:px-[4.5%]">
          <h2 className={`${h2} text-center`}>{forms.heading}</h2>
          <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-14">
            {forms.groups.map((g) => (
              <div key={g.heading} className="flex flex-col items-center">
                <h3
                  className={`${display} w-full border-b-2 border-(--t2-navy) pb-5 text-center text-[1.2rem] leading-[1.05] font-black whitespace-pre-line text-(--t2-navy)`}
                >
                  {g.heading}
                </h3>
                <div className="mt-5 flex w-full flex-col items-center gap-4">
                  {g.links.map((l) => (
                    <a key={l.label} href={l.url} {...externalProps(l.url)} className={`${btnNavy} max-w-full`}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex justify-center">
            <a href={forms.portalLink.url} {...externalProps(forms.portalLink.url)} className={`${btnNavy} max-w-full`}>
              {forms.portalLink.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
