import Image from "next/image";
import { Menu } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnPrimary, container, externalProps } from "./theme";

export function Header({ site, copy }: TemplateProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-(--t1-teal-deep)/95 text-white backdrop-blur">
      <div className={`${container} flex items-center gap-6 py-3`}>
        <a href="#home" className="shrink-0">
          <Image
            unoptimized
            src={site.logoUrl}
            alt={`${site.businessName} logo`}
            width={180}
            height={56}
            className="h-12 w-auto rounded-md bg-white object-contain p-1"
          />
        </a>
        <nav aria-label="Primary" className="hidden flex-1 justify-center gap-7 text-sm font-medium lg:flex">
          {copy.nav.map((l) => (
            <a key={l.url} href={l.url} className="text-white/80 transition hover:text-(--t1-orange)">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden gap-2 sm:flex lg:ml-0">
          {copy.headerButtons.map((b, i) => (
            <a
              key={b.url}
              href={b.url}
              {...externalProps(b.url)}
              className={
                i === 0
                  ? "inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/40 transition hover:bg-white/10"
                  : `${btnPrimary} px-4! py-2! text-xs!`
              }
            >
              {b.label}
            </a>
          ))}
        </div>
        <details className="relative ml-auto sm:ml-0 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-2 ring-1 ring-white/30">
            <Menu className="size-5" aria-hidden />
            <span className="text-sm">Menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white p-2 text-slate-800 shadow-xl">
            {[...copy.nav, ...copy.headerButtons].map((l) => (
              <a
                key={l.url + l.label}
                href={l.url}
                {...externalProps(l.url)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-(--t1-mint)"
              >
                {l.label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
