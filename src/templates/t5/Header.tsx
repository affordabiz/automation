"use client";

import Image from "next/image";
import { ArrowUpRight, Menu, PlayCircle, X } from "lucide-react";
import { useSiteHeader, visibleButtons } from "../shared/useSiteHeader";
import type { TemplateProps } from "../types";
import { btnNavy, btnRed, container, externalProps, isExternal, oswald } from "./theme";

export function Header({ site, copy }: TemplateProps) {
  const { open, setOpen, scrolled, active, go, panelRef, toggleRef } = useSiteHeader(copy.nav);
  const buttons = visibleButtons(copy.headerButtons);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-(--t5-sage)/95 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-[0_8px_28px_-14px_rgba(0,0,0,0.35)]" : "shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className={`${container} flex h-[72px] items-center gap-6 lg:h-[84px] xl:max-w-[1300px]`}>
          <a
            href="#home"
            onClick={(e) => go(e, "#home")}
            className="flex shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--t5-red)"
          >
            <Image
              unoptimized
              priority
              src={site.logoUrl}
              alt={`${site.businessName} logo`}
              width={170}
              height={44}
              className="h-10 w-auto max-w-[9.5rem] object-contain lg:h-11 lg:max-w-[11rem]"
            />
          </a>

          <nav aria-label="Primary" className={`${oswald} hidden items-center gap-5 xl:flex`}>
            {copy.nav.map((l) => {
              const current = active === l.url;
              return (
                <a
                  key={l.url + l.label}
                  href={l.url}
                  onClick={(e) => go(e, l.url)}
                  aria-current={current ? "true" : undefined}
                  {...externalProps(l.url)}
                  className={`relative py-2 text-[0.95rem] font-medium tracking-[1px] uppercase transition-colors ${
                    current ? "text-(--t5-yellow)" : "text-white hover:text-(--t5-yellow)"
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-(--t5-yellow) transition-transform duration-300 ${
                      current ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {buttons.map((b) => (
              <a
                key={b.url + b.label}
                href={b.url}
                {...externalProps(b.url)}
                className={`${btnNavy} min-h-11! px-5! py-2.5! text-xs! max-md:hidden`}
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
              aria-controls="t5-mobile-menu"
              aria-label="Open menu"
              className="grid size-11 place-items-center rounded-md bg-(--t5-navy) text-white transition hover:bg-(--t5-red) xl:hidden"
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
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          ref={panelRef}
          id="t5-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-black/5 px-5">
            <Image
              unoptimized
              src={site.logoUrl}
              alt={`${site.businessName} logo`}
              width={150}
              height={40}
              className="h-10 w-auto max-w-[9.5rem] object-contain"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-11 place-items-center rounded-md bg-(--t5-grey)/60 text-(--t5-ink) transition hover:bg-(--t5-grey)"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className={`${oswald} flex flex-col px-3 py-4`}>
            {copy.nav.map((l, i) => (
              <a
                key={l.url + l.label}
                href={l.url}
                onClick={(e) => go(e, l.url)}
                {...externalProps(l.url)}
                style={{ transitionDelay: open ? `${80 + i * 35}ms` : "0ms" }}
                className={`flex items-center justify-between rounded-md px-4 py-3.5 text-xl font-medium tracking-[1px] uppercase transition-all duration-300 hover:bg-(--t5-mist) ${
                  active === l.url ? "text-(--t5-red)" : "text-(--t5-mauve)"
                } ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
              >
                {l.label}
                {isExternal(l.url) && <ArrowUpRight className="size-5 opacity-60" aria-hidden />}
              </a>
            ))}
          </nav>
          {buttons.length > 0 && (
            <div className="mt-auto space-y-3 border-t border-black/5 p-5">
              {buttons.map((b) => (
                <a key={b.url + b.label} href={b.url} {...externalProps(b.url)} className={`${btnRed} w-full`}>
                  <PlayCircle className="size-4" aria-hidden />
                  {b.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
