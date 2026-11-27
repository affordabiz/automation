"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CircleCheck, CircleX, ExternalLink, Globe, LoaderCircle, Lock } from "lucide-react";
import { ONBOARDING_FIELDS, type FieldDef } from "@/forms/onboarding.fields";
import type { OwnPage } from "@/lib/payments/access";
import type { ProductKey } from "@/lib/payments/products";
import { slugify } from "@/lib/slug";
import { getTemplateMeta, TEMPLATE_CATALOG } from "@/templates/catalog";
import { ImageInput } from "./ImageInput";
import { useFormView } from "@/components/forms/useFormView";
import { SubmittedView } from "./SubmittedView";
import { useSlugAvailability, type SlugStatus } from "./useSlugAvailability";

type Errors = Partial<Record<string, string[]>>;

const input =
  "mt-2 block w-full rounded-xl border-0 px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 aria-[invalid=true]:ring-red-500";

const TEXT_DEFS: readonly FieldDef[] = ONBOARDING_FIELDS.filter((f) =>
  ["text", "email", "tel", "textarea"].includes(f.type),
);
const IMAGE_DEFS: readonly FieldDef[] = ONBOARDING_FIELDS.filter((f) => f.type === "image");

function formatAccept(accept: readonly string[]): string {
  return accept.map((a) => a.split("/")[1].replace("+xml", "").toUpperCase()).join(", ");
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function SlugMessage({ status, onUseSuggestion }: { status: SlugStatus; onUseSuggestion: (s: string) => void }) {
  switch (status.state) {
    case "checking":
      return (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500" aria-live="polite">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Checking…
        </p>
      );
    case "available":
      return (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600" aria-live="polite">
          <CircleCheck className="size-4" aria-hidden />
          Available
        </p>
      );
    case "taken":
      return (
        <p className="mt-2 text-sm text-red-600" aria-live="polite">
          <CircleX className="mr-1 inline size-4 align-text-bottom" aria-hidden />
          {status.message}
          {status.suggestion && (
            <>
              {" "}
              Try{" "}
              <button
                type="button"
                onClick={() => onUseSuggestion(status.suggestion!)}
                className="font-semibold underline"
              >
                {status.suggestion}
              </button>
            </>
          )}
        </p>
      );
    case "invalid":
      return (
        <p className="mt-2 text-sm text-red-600" aria-live="polite">
          {status.message}
        </p>
      );
    case "error":
      return (
        <p className="mt-2 text-sm text-amber-600" aria-live="polite">
          Couldn&apos;t check this address right now — we&apos;ll check again when you submit.
        </p>
      );
    default:
      return null;
  }
}

const PAGE_STATUS: Record<OwnPage["status"], string> = {
  approved: "Live",
  suspended: "Offline",
  draft: "Draft",
  pending: "In review",
};

const PREFILL: Partial<Record<string, keyof OwnPage>> = {
  fullName: "fullName",
  businessName: "businessName",
  email: "email",
  phone: "phone",
  address: "address",
  servingArea: "servingArea",
};

export function OnboardingForm({
  siteHost,
  access,
  product,
  paymentEmail,
  pages,
}: {
  siteHost: string;
  access: string;
  product: ProductKey;
  paymentEmail: string | null;
  pages: readonly OwnPage[];
}) {
  const renew = product === "renew";
  const [replaceId, setReplaceId] = useState<string | null>(pages[0]?.id ?? null);
  const current = pages.find((p) => p.id === replaceId) ?? null;
  const [keepSlug, setKeepSlug] = useState(true);
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [template, setTemplate] = useState<number | null>(renew ? (pages[0]?.templateNumber ?? null) : null);
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ email: string; url?: string } | null>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const keepingAddress = current !== null && keepSlug;
  const slugCheck = useSlugAvailability(keepingAddress ? "" : slug);
  useFormView("__onboarding__");

  function choosePage(page: OwnPage | null) {
    setReplaceId(page?.id ?? null);
    setKeepSlug(true);
    setSlugEdited(false);
    setSlug("");
    setTemplate(renew ? (page?.templateNumber ?? null) : null);
    setErrors({});
  }

  const err = (name: string) => errors[name]?.[0];
  const slugReady = keepingAddress || slugCheck.status.state === "available";
  const canSubmit = slugReady && template !== null && token !== "" && !submitting && (!renew || current !== null);

  if (renew && pages.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h2 className="text-xl font-semibold text-slate-900">We couldn&apos;t find last year&apos;s webpage</h2>
        <p className="mt-2 text-slate-600">
          There&apos;s no webpage for <strong>{paymentEmail ?? "the email you paid with"}</strong> yet. It may be under a
          different email. Reply to your payment email and we&apos;ll link it for you. Your payment is safe, and this
          link will keep working.
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("slug", keepingAddress && current ? current.slug : slug);
    fd.set("cf-turnstile-response", token);
    fd.set("access", access);
    fd.set("replaceId", current?.id ?? "");
    if (template !== null) fd.set("templateNumber", String(template));
    try {
      const res = await fetch("/api/sites", { method: "POST", body: fd });
      const body = (await res.json().catch(() => ({}))) as {
        status?: string;
        url?: string;
        errors?: Errors;
        suggestion?: string;
        error?: string;
      };
      if (res.status === 201 && (body.status === "pending" || body.status === "published")) {
        setSubmitted({ email: String(fd.get("email")), url: body.status === "published" ? body.url : undefined });
        window.scrollTo({ top: 0 });
        return;
      }
      if (res.status === 409) slugCheck.markTaken(body.suggestion);
      if (body.errors) setErrors(body.errors);
      setFormError(body.error ?? "Please fix the highlighted fields.");
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
      turnstile.current?.reset();
      setToken("");
    }
  }

  if (submitted) return <SubmittedView email={submitted.email} url={submitted.url} />;

  const defaultFor = (name: string): string | undefined => {
    const key = PREFILL[name];
    if (current && key) return String(current[key] ?? "");
    if (name === "email") return paymentEmail ?? undefined;
    return undefined;
  };

  const textField = (def: FieldDef) => {
    const id = `field-${def.name}`;
    const common = {
      id,
      name: def.name,
      required: true,
      maxLength: def.maxLength,
      placeholder: def.placeholder,
      autoComplete: def.autoComplete,
      defaultValue: defaultFor(def.name),
      "aria-invalid": err(def.name) ? true : undefined,
      "aria-describedby": def.help ? `${id}-help` : undefined,
      className: input,
    };
    return (
      <div key={def.name} className={def.type === "textarea" || def.name === "email" ? "sm:col-span-2" : ""}>
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
          {def.label}
        </label>
        {def.type === "textarea" ? (
          <textarea rows={2} {...common} />
        ) : (
          <input
            type={def.type === "text" ? "text" : def.type}
            {...common}
            onChange={
              def.name === "businessName"
                ? (e) => {
                    if (!slugEdited && !keepingAddress) setSlug(slugify(e.target.value));
                  }
                : undefined
            }
          />
        )}
        {def.help && (
          <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">
            {def.help}
          </p>
        )}
        {err(def.name) && <p className="mt-1 text-sm text-red-600">{err(def.name)}</p>}
      </div>
    );
  };

  const slugInvalid = !keepingAddress && (slugCheck.status.state === "taken" || slugCheck.status.state === "invalid");
  const optionClass = (on: boolean) =>
    `flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 transition ${on ? "bg-teal-50/60 ring-2 ring-teal-700" : "ring-slate-200 hover:ring-slate-300"}`;
  const lockedTemplate = renew && current ? getTemplateMeta(current.templateNumber) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {pages.length > 0 && (
        <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <legend className="sr-only">Your current webpage</legend>
          <h2 className="text-lg font-semibold text-slate-900">
            {renew ? "Which webpage are you renewing?" : "Is this replacing your current webpage?"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Your current webpage moves to draft and the new one goes live in its place. We&apos;ve filled in its details
            below, so you only need to change what&apos;s new.
          </p>
          <div className="mt-5 grid gap-3">
            {pages.map((p) => (
              <label key={p.id} className={optionClass(replaceId === p.id)}>
                <input
                  type="radio"
                  name="replaceChoice"
                  className="mt-1"
                  checked={replaceId === p.id}
                  onChange={() => choosePage(p)}
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">{p.businessName || p.fullName}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex min-w-0 items-center gap-1 break-all font-mono text-xs">
                      <Globe className="size-3.5 shrink-0" aria-hidden /> {siteHost}/{p.slug}
                    </span>
                    <span>{getTemplateMeta(p.templateNumber)?.name ?? `Template ${p.templateNumber}`}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{PAGE_STATUS[p.status]}</span>
                  </span>
                </span>
              </label>
            ))}
            {!renew && (
              <label className={optionClass(replaceId === null)}>
                <input
                  type="radio"
                  name="replaceChoice"
                  className="mt-1"
                  checked={replaceId === null}
                  onChange={() => choosePage(null)}
                />
                <span>
                  <span className="block font-semibold text-slate-900">No, this is a separate new webpage</span>
                  <span className="text-sm text-slate-600">My current webpage stays as it is.</span>
                </span>
              </label>
            )}
          </div>
        </fieldset>
      )}

      <div key={replaceId ?? "fresh"} className="space-y-6">
        <Section title="Your details">{TEXT_DEFS.map((d) => textField(d))}</Section>

        <Section title="Your web address">
          <div className="space-y-3 sm:col-span-2">
            {current && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={optionClass(keepSlug)}>
                  <input type="radio" name="slugChoice" className="mt-1" checked={keepSlug} onChange={() => setKeepSlug(true)} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900">Keep my web address</span>
                    <span className="block break-all font-mono text-xs text-slate-600">
                      {siteHost}/{current.slug}
                    </span>
                  </span>
                </label>
                <label className={optionClass(!keepSlug)}>
                  <input
                    type="radio"
                    name="slugChoice"
                    className="mt-1"
                    checked={!keepSlug}
                    onChange={() => {
                      setKeepSlug(false);
                      setSlug("");
                    }}
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Use a new web address</span>
                    <span className="text-sm text-slate-600">Your old address will stop working.</span>
                  </span>
                </label>
              </div>
            )}
            {!keepingAddress && (
              <div>
                <label htmlFor="field-slug" className="block text-sm font-semibold text-slate-800">
                  {current ? "New web address" : "Web address"}
                </label>
                <div
                  className={`mt-2 flex rounded-xl shadow-sm ring-1 focus-within:ring-2 ${slugInvalid ? "ring-red-500" : "ring-slate-300 focus-within:ring-slate-900"}`}
                >
                  <span className="flex items-center rounded-l-xl bg-slate-50 px-3 text-sm text-slate-500">{siteHost}/</span>
                  <input
                    id="field-slug"
                    name="slug"
                    required
                    maxLength={50}
                    value={slug}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={slugInvalid ? true : undefined}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    onBlur={() => slugCheck.checkNow()}
                    className="block w-full min-w-0 rounded-r-xl border-0 px-3 py-3 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
                <SlugMessage
                  status={slugCheck.status}
                  onUseSuggestion={(s) => {
                    setSlugEdited(true);
                    setSlug(s);
                  }}
                />
              </div>
            )}
            {err("slug") && slugCheck.status.state !== "taken" && <p className="mt-1 text-sm text-red-600">{err("slug")}</p>}
          </div>
        </Section>

        {lockedTemplate ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Your template</h2>
            <div className="mt-5 flex items-center gap-4 rounded-2xl p-4 ring-1 ring-slate-200">
              <div className="flex h-14 w-24 shrink-0 overflow-hidden rounded-xl" aria-hidden>
                <span className="flex-[2]" style={{ background: lockedTemplate.swatch[0] }} />
                <span className="flex-1" style={{ background: lockedTemplate.swatch[1] }} />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Lock className="size-3.5 text-slate-500" aria-hidden /> {lockedTemplate.name}
                </p>
                <p className="text-sm text-slate-600">Renewals keep the same template as last year.</p>
              </div>
            </div>
          </section>
        ) : (
          <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <legend className="sr-only">Template</legend>
            <h2 className="text-lg font-semibold text-slate-900">Choose a template</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATE_CATALOG.map((t) => {
                const live = t.status === "live";
                return (
                  <div
                    key={t.number}
                    className={`rounded-2xl p-4 ring-1 transition ${template === t.number ? "ring-2 ring-slate-900" : "ring-slate-200"} ${live ? "" : "opacity-60"}`}
                  >
                    <div className="flex h-20 overflow-hidden rounded-xl" aria-hidden>
                      <span className="flex-[2]" style={{ background: t.swatch[0] }} />
                      <span className="flex-1" style={{ background: t.swatch[1] }} />
                    </div>
                    <label
                      className={`mt-3 flex items-center gap-2 text-sm font-semibold ${live ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      <input
                        type="radio"
                        name="templateNumber"
                        value={t.number}
                        disabled={!live}
                        required
                        checked={template === t.number}
                        onChange={() => setTemplate(t.number)}
                      />
                      {t.name}
                    </label>
                    {current?.templateNumber === t.number && (
                      <p className="mt-1 text-xs text-slate-500">Your current template</p>
                    )}
                    {live ? (
                      <a
                        href={`/templates/${t.number}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 underline"
                      >
                        Preview <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">Coming soon</p>
                    )}
                  </div>
                );
              })}
            </div>
            {err("templateNumber") && <p className="mt-3 text-sm text-red-600">{err("templateNumber")}</p>}
          </fieldset>
        )}

        <Section title="Branding">
          {IMAGE_DEFS.map((def) => {
            const existing = current ? (def.name === "logo" ? current.logoUrl : current.photoUrl) : null;
            return (
              <ImageInput
                key={def.name}
                name={def.name}
                label={def.label}
                accept={def.accept ?? []}
                rounded={def.name === "photo"}
                error={err(def.name)}
                existingUrl={existing}
                help={`${formatAccept(def.accept ?? [])} · max 5 MB${existing ? " · leave empty to keep your current one" : ""}`}
              />
            );
          })}
        </Section>
      </div>

      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="flex flex-col items-start gap-4">
        <Turnstile
          ref={turnstile}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
          onSuccess={setToken}
          onExpire={() => setToken("")}
        />
        {formError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {submitting ? "Publishing…" : "Publish my webpage"}
        </button>
        {!keepingAddress && slugCheck.status.state !== "available" && slug !== "" && (
          <p className="text-xs text-slate-500">Choose an available web address to continue.</p>
        )}
      </div>
    </form>
  );
}
