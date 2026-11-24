import type { TemplateProps } from "../types";
import { container, display } from "./theme";

export function Footer({ site, copy }: TemplateProps) {
  return (
    <footer className="bg-(--t1-ink) py-10 text-white/60 sm:py-12">
      <div className={`${container} flex flex-col items-center gap-5 text-center`}>
        <p className={`${display} text-lg font-bold text-white`}>{site.businessName}</p>
        <p className="max-w-3xl text-xs leading-relaxed sm:text-sm">{copy.footer.text}</p>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {copy.footer.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/75 underline-offset-4 transition hover:text-(--t1-orange) hover:underline"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
