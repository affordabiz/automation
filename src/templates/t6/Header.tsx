import Image from "next/image";
import { Mail, Phone, PlayCircle } from "lucide-react";
import { visibleButtons } from "../shared/buttons";
import type { TemplateProps } from "../types";
import { btnAccent, externalProps, telHref } from "./variant";

/** Sticky contact bar: logo, phone, email and the Hiree Video button. */
export function Header({ site, copy }: TemplateProps) {
  const buttons = visibleButtons(copy.headerButtons);
  return (
    <header className="sticky top-0 z-50 bg-(--x-dark)/95 text-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1300px] items-center gap-4 px-4 sm:px-8 lg:h-[76px]">
        <a href="#home" className="flex shrink-0 items-center rounded-lg bg-white px-2.5 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--x-accent)">
          <Image unoptimized priority src={site.logoUrl} alt={`${site.businessName} logo`} width={150} height={40} className="h-8 w-auto max-w-[8.5rem] object-contain sm:h-9 sm:max-w-[10rem]" />
        </a>
        <div className="ml-auto flex items-center gap-2 sm:gap-6">
          <a href={telHref(site.phone)} className="hidden items-center gap-2 text-sm font-medium transition hover:text-(--x-accent) md:flex">
            <Phone className="size-4 text-(--x-accent)" aria-hidden />
            {site.phone}
          </a>
          <a href={`mailto:${site.email}`} className="hidden items-center gap-2 text-sm font-medium transition hover:text-(--x-accent) lg:flex">
            <Mail className="size-4 text-(--x-accent)" aria-hidden />
            {site.email}
          </a>
          <a
            href={telHref(site.phone)}
            aria-label={`Call ${site.phone}`}
            className="grid size-10 place-items-center rounded-lg bg-white/10 text-(--x-accent) transition hover:bg-white/20 md:hidden"
          >
            <Phone className="size-5" aria-hidden />
          </a>
          {buttons.map((b) => (
            <a key={b.url + b.label} href={b.url} {...externalProps(b.url)} className={`${btnAccent} min-h-10! px-4! py-2! text-xs! normal-case! sm:px-5!`}>
              <PlayCircle className="size-4" aria-hidden />
              {b.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
