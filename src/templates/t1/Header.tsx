"use client";

import Image from "next/image";
import { ArrowUpRight, Mail, Menu, Phone, PlayCircle, X } from "lucide-react";
import { useSiteHeader, visibleButtons } from "../shared/useSiteHeader";
import type { TemplateProps } from "../types";
import { btnPrimary, container, display, externalProps, isExternal, telHref } from "./theme";

export function Header({ site, copy }: TemplateProps) {
  const { open, setOpen, scrolled, active, go, panelRef, toggleRef } = useSiteHeader(copy.nav);
  const buttons = visibleButtons(copy.headerButtons);

  return (
    <>
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_8px_30px_-12px_rgba(7,47,41,0.25)]" : "shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className={`${container} flex h-[72px] items-center gap-4 lg:h-20`}>
        <a
          href="#home"
          onClick={(e) => go(e, "#home")}
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--t1-orange)"
        >
          <Image
            unoptimized
            priority
            src={site.logoUrl}
            alt={`${site.businessName} logo`}
            width={160}
            height={56}
            className="h-12 w-auto max-w-[9rem] shrink-0 object-contain sm:h-14 sm:max-w-[11rem]"
          />
          <span className={`${display} hidden min-w-0 flex-col leading-tight sm:flex`}>
            <span className="truncate text-[1.05rem] font-bold text-(--t1-ink)">{site.businessName}</span>
            <span className="truncate text-xs font-medium text-slate-500">{site.fullName}</span>
          </span>
        </a>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 xl:flex">
          {copy.nav.map((l) => {
            const current = active === l.url;
            return (
              <a
                key={l.url + l.label}
                href={l.url}
                onClick={(e) => go(e, l.url)}
                aria-current={current ? "true" : undefined}
                {...externalProps(l.url)}
                className={`relative rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
                  current ? "text-(--t1-teal)" : "text-slate-600 hover:text-(--t1-teal)"
                }`}
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left rounded-full bg-(--t1-orange) transition-transform duration-300 ${
                    current ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          {buttons.map((b) => (
            <a
              key={b.url + b.label}
              href={b.url}
              {...externalProps(b.url)}
              className={`${btnPrimary} min-h-11! px-5! py-2.5! text-sm! max-md:hidden`}
            >
              <PlayCircle className="size-4" aria-hidden />
              {b.label}
            </a>
          ))}
          <a
            href={telHref(site.phone)}
            aria-label={`Call ${site.phone}`}
            className="grid size-11 place-items-center rounded-full bg-(--t1-mint) text-(--t1-teal) transition hover:bg-(--t1-teal) hover:text-white md:hidden"
          >
            <Phone className="size-5" aria-hidden />
          </a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="t1-mobile-menu"
            aria-label="Open menu"
            className="grid size-11 place-items-center rounded-full bg-(--t1-teal) text-white transition hover:bg-(--t1-teal-deep) xl:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile and tablet menu. Kept outside the header: its backdrop blur would trap a fixed panel. */}
      <div
        className={`fixed inset-0 z-[60] xl:hidden ${open ? "visible" : "invisible"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-(--t1-ink)/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          ref={panelRef}
          id="t1-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
            <span className={`${display} truncate pr-4 text-lg font-bold text-(--t1-ink)`}>{site.businessName}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col px-3 py-4">
            {copy.nav.map((l, i) => (
              <a
                key={l.url + l.label}
                href={l.url}
                onClick={(e) => go(e, l.url)}
                {...externalProps(l.url)}
                style={{ transitionDelay: open ? `${80 + i * 35}ms` : "0ms" }}
                className={`${display} flex items-center justify-between rounded-xl px-4 py-3.5 text-xl font-semibold transition-all duration-300 hover:bg-(--t1-mint) ${
                  active === l.url ? "text-(--t1-teal)" : "text-(--t1-ink)"
                } ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
              >
                {l.label}
                {isExternal(l.url) && <ArrowUpRight className="size-5 text-slate-400" aria-hidden />}
              </a>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-slate-100 p-5">
            {buttons.map((b) => (
              <a key={b.url + b.label} href={b.url} {...externalProps(b.url)} className={`${btnPrimary} w-full`}>
                <PlayCircle className="size-4" aria-hidden />
                {b.label}
              </a>
            ))}
            <a
              href={telHref(site.phone)}
              className="flex items-center gap-3 rounded-2xl bg-(--t1-mint) px-4 py-3 text-sm font-semibold text-(--t1-teal)"
            >
              <Phone className="size-4 shrink-0" aria-hidden />
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-3 rounded-2xl bg-(--t1-mint) px-4 py-3 text-sm font-semibold break-all text-(--t1-teal)"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
