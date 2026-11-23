import { ClipboardCheck, FilePen, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnPrimary, btnTeal, container, display, externalProps } from "./theme";

const ICONS = [ClipboardCheck, FilePen];

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className="scroll-mt-20 bg-(--t1-mint) py-20 lg:py-28">
      <div className={container}>
        <h2 className={`${display} text-center text-4xl font-semibold text-(--t1-teal) sm:text-5xl`}>{forms.heading}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {forms.groups.map((g, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article key={g.heading} className="flex flex-col items-center rounded-3xl bg-white p-8 text-center shadow-sm">
                <Icon className="size-10 text-(--t1-teal)" aria-hidden />
                <h3 className={`${display} mt-4 max-w-sm text-xl font-semibold text-(--t1-teal)`}>{g.heading}</h3>
                <div className="mt-6 flex w-full flex-col gap-3">
                  {g.links.map((l) => (
                    <a key={l.label} href={l.url} {...externalProps(l.url)} className={btnPrimary}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-6 flex justify-center">
          <a
            href={forms.portalLink.url}
            {...externalProps(forms.portalLink.url)}
            className={`${btnTeal} w-full max-w-xl py-4!`}
          >
            <Upload className="size-4" aria-hidden />
            {forms.portalLink.label}
          </a>
        </div>
      </div>
    </section>
  );
}
