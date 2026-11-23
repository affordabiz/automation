import type { TemplateProps } from "../types";
import { container } from "./theme";

export function Footer({ copy }: TemplateProps) {
  return (
    <footer className="bg-(--t1-teal-deep) py-8 text-xs text-white/65">
      <div className={`${container} flex flex-col items-center gap-3 text-center`}>
        <p className="max-w-3xl leading-relaxed">{copy.footer.text}</p>
        <nav aria-label="Legal" className="flex gap-4">
          {copy.footer.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:text-white hover:underline"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
