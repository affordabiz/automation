import type { TemplateProps } from "../types";
import { container } from "./theme";

export function Footer({ copy }: TemplateProps) {
  return (
    <footer className="border-t border-(--t2-navy)/10 bg-(--t2-sand) py-10 text-slate-600 sm:py-12">
      <div className={`${container} flex flex-col items-center gap-4 text-center`}>
        <p className="max-w-3xl text-xs leading-relaxed sm:text-sm">{copy.footer.text}</p>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {copy.footer.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-(--t2-navy) underline-offset-4 transition hover:underline"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
