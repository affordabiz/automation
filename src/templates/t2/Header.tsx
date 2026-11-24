"use client";

import Image from "next/image";
import { ArrowUpRight, Menu, PlayCircle, X } from "lucide-react";
import { useSiteHeader, visibleButtons } from "../shared/useSiteHeader";
import type { TemplateProps } from "../types";
import { btnTan, container, display, externalProps, isExternal } from "./theme";

export function Header({ site, copy }: TemplateProps) {
  const { open, setOpen, scrolled, active, go, panelRef, toggleRef } = useSiteHeader(copy.nav);
  const buttons = visibleButtons(copy.headerButtons);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-(--t2-navy)/95 text-white backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]" : ""
        }`}
      >
        <div className={`${container} flex h-[72px] items-center gap-4 lg:h-20`}>
          <a
            href="#home"
            onClick={(e) => go(e, "#home")}
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--t2-tan)"
          >
            <span className="grid shrink-0 place-items-center rounded-xl bg-white p-1">
              <Image
                unoptimized
                priority
                src={site.logoUrl}
                alt={`${site.businessName} logo`}
                width={160}
                height={56}
                className="h-10 w-auto max-w-[8.5rem] object-contain sm:h-11 sm:max-w-[10rem]"
              />
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
                  className={`rounded-full px-3.5 py-2 text-[0.8rem] font-bold uppercase tracking-[0.12em] transition-colors ${
                    current ? "bg-white/10 text-(--t2-tan)" : "text-white/80 hover:text-(--t2-tan)"
                  }`}
                >
                  {l.label}
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
                className={`${btnTan} min-h-11! px-5! py-2.5! text-sm! max-md:hidden`}
              >
                <PlayCircle className="size-4" aria-hidden />
                {b.label}
              </a>
            ))}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="t2-mobile-menu"
              aria-label="Open menu"
              className="grid size-11 place-items-center rounded-full bg-(--t2-tan) text-(--t2-navy) transition hover:bg-white xl:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Kept outside the header: its backdrop blur would trap a fixed panel. */}
      <div className={`fixed inset-0 z-[60] xl:hidden ${open ? "visible" : "invisible"}`} aria-hidden={!open} inert={!open}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-(--t2-navy-deep)/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          ref={panelRef}
          id="t2-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-(--t2-cream) shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between bg-(--t2-navy) px-5 text-white">
            <span className="grid shrink-0 place-items-center rounded-xl bg-white p-1">
              <Image
                unoptimized
                src={site.logoUrl}
                alt={`${site.businessName} logo`}
                width={140}
                height={48}
                className="h-10 w-auto max-w-[8.5rem] object-contain"
              />
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
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
                className={`${display} flex items-center justify-between rounded-xl px-4 py-3 text-[1.7rem] leading-none font-black uppercase transition-all duration-300 hover:bg-(--t2-mint)/50 ${
                  active === l.url ? "text-(--t2-navy) underline decoration-(--t2-tan) decoration-4 underline-offset-8" : "text-(--t2-navy)"
                } ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
              >
                {l.label}
                {isExternal(l.url) && <ArrowUpRight className="size-5 text-slate-400" aria-hidden />}
              </a>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-(--t2-navy)/10 p-5">
            {buttons.map((b) => (
              <a key={b.url + b.label} href={b.url} {...externalProps(b.url)} className={`${btnTan} w-full`}>
                <PlayCircle className="size-4" aria-hidden />
                {b.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
