"use client";

import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useSiteHeader, visibleButtons } from "../shared/useSiteHeader";
import type { TemplateProps } from "../types";
import { display, externalProps, isExternal, navFont } from "./theme";

export function Header({ site, copy }: TemplateProps) {
  const { open, setOpen, scrolled, active, go, panelRef, toggleRef } = useSiteHeader(copy.nav);
  const buttons = visibleButtons(copy.headerButtons);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-(--t2-sage) text-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]" : ""
        }`}
      >
        <div className="flex h-[72px] items-stretch pl-5 sm:pl-8 lg:h-24 lg:pl-[3.8%]">
          <a
            href="#home"
            onClick={(e) => go(e, "#home")}
            className="flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Image
              unoptimized
              priority
              src={site.logoUrl}
              alt={`${site.businessName} logo`}
              width={216}
              height={56}
              className="h-10 w-auto max-w-[10rem] object-contain lg:h-14 lg:max-w-[13.5rem]"
            />
          </a>

          <nav aria-label="Primary" className={`${navFont} ml-8 hidden items-center gap-6 xl:flex`}>
            {copy.nav.map((l) => (
              <a
                key={l.url + l.label}
                href={l.url}
                onClick={(e) => go(e, l.url)}
                aria-current={active === l.url ? "true" : undefined}
                {...externalProps(l.url)}
                className={`text-base font-bold tracking-[2px] uppercase transition-opacity ${
                  active === l.url ? "opacity-100" : "opacity-95 hover:opacity-70"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-stretch">
            {buttons.length > 0 && (
              <div className="hidden items-stretch bg-(--t2-navy) px-3 md:flex lg:px-5">
                {buttons.map((b) => (
                  <a
                    key={b.url + b.label}
                    href={b.url}
                    {...externalProps(b.url)}
                    className={`${display} flex w-24 items-center justify-center px-2 text-center text-[1.05rem] leading-[0.9] font-black whitespace-pre-line text-white transition hover:text-(--t2-tan) lg:w-[6.5rem]`}
                  >
                    {b.label.replace(" ", "\n")}
                  </a>
                ))}
              </div>
            )}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="t2-mobile-menu"
              aria-label="Open menu"
              className="grid w-[72px] place-items-center bg-(--t2-navy) text-white transition hover:bg-black md:ml-px xl:hidden"
            >
              <Menu className="size-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Kept outside the header so the fixed panel covers the whole screen. */}
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
          id="t2-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-(--t2-navy) text-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between bg-(--t2-sage) pl-5">
            <Image
              unoptimized
              src={site.logoUrl}
              alt={`${site.businessName} logo`}
              width={160}
              height={42}
              className="h-10 w-auto max-w-[10rem] object-contain"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid h-full w-[72px] place-items-center bg-(--t2-navy) transition hover:bg-black"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className={`${navFont} flex flex-col py-3`}>
            {copy.nav.map((l, i) => (
              <a
                key={l.url + l.label}
                href={l.url}
                onClick={(e) => go(e, l.url)}
                {...externalProps(l.url)}
                style={{ transitionDelay: open ? `${80 + i * 35}ms` : "0ms" }}
                className={`flex items-center justify-between border-b border-white/10 px-6 py-4 text-base font-bold tracking-[2px] uppercase transition-all duration-300 hover:bg-white/5 ${
                  active === l.url ? "text-(--t2-tan)" : "text-white"
                } ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
              >
                {l.label}
                {isExternal(l.url) && <ArrowUpRight className="size-5 opacity-60" aria-hidden />}
              </a>
            ))}
          </nav>
          {buttons.length > 0 && (
            <div className="mt-auto grid grid-cols-2 gap-px bg-white/10">
              {buttons.map((b) => (
                <a
                  key={b.url + b.label}
                  href={b.url}
                  {...externalProps(b.url)}
                  className={`${display} grid min-h-20 place-items-center bg-(--t2-navy) px-3 text-center text-lg leading-[0.95] font-black whitespace-pre-line transition hover:bg-black hover:text-(--t2-tan)`}
                >
                  {b.label.replace(" ", "\n")}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
