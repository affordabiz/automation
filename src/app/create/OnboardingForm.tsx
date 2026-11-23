"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CircleCheck, CircleX, ExternalLink, LoaderCircle } from "lucide-react";
import { ONBOARDING_FIELDS, type FieldDef } from "@/forms/onboarding.fields";
import { slugify } from "@/lib/slug";
import { TEMPLATE_CATALOG } from "@/templates/catalog";
import { ImageInput } from "./ImageInput";
import { useSlugAvailability, type SlugStatus } from "./useSlugAvailability";

type Errors = Partial<Record<string, string[]>>;

const input =
  "mt-2 block w-full rounded-xl border-0 px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 aria-[invalid=true]:ring-red-500";

const siteHost = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

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

export function OnboardingForm() {
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [template, setTemplate] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ email: string; url?: string } | null>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const slugCheck = useSlugAvailability(slug);

  const err = (name: string) => errors[name]?.[0];
  const canSubmit = slugCheck.status.state === "available" && template !== null && token !== "" && !submitting;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("slug", slug);
    fd.set("cf-turnstile-response", token);
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

  if (submitted) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <CircleCheck className="mx-auto size-12 text-emerald-500" aria-hidden />
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">
          {submitted.url ? "Your webpage is live" : "Your request is under review"}
        </h2>
        {submitted.url ? (
          <a
            href={submitted.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {submitted.url.replace(/^https?:\/\//, "")}
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : (
          <p className="mt-2 text-slate-600">
            Once our team approves your webpage, we&apos;ll email the link to <strong>{submitted.email}</strong>.
          </p>
        )}
      </div>
    );
  }

  const textField = (def: FieldDef) => {
    const id = `field-${def.name}`;
    const common = {
      id,
      name: def.name,
      required: true,
      maxLength: def.maxLength,
      placeholder: def.placeholder,
      autoComplete: def.autoComplete,
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
                    if (!slugEdited) setSlug(slugify(e.target.value));
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

  const slugInvalid = slugCheck.status.state === "taken" || slugCheck.status.state === "invalid";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Your details">{TEXT_DEFS.map((d) => textField(d))}</Section>

      <Section title="Your web address">
        <div className="sm:col-span-2">
          <label htmlFor="field-slug" className="block text-sm font-semibold text-slate-800">
            Web address
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
          {err("slug") && slugCheck.status.state !== "taken" && (
            <p className="mt-1 text-sm text-red-600">{err("slug")}</p>
          )}
        </div>
      </Section>

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

      <Section title="Branding">
        {IMAGE_DEFS.map((def) => (
          <ImageInput
            key={def.name}
            name={def.name}
            label={def.label}
            accept={def.accept ?? []}
            rounded={def.name === "photo"}
            error={err(def.name)}
            help={`${formatAccept(def.accept ?? [])} · max 5 MB`}
          />
        ))}
      </Section>

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
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
        {slugCheck.status.state !== "available" && slug !== "" && (
          <p className="text-xs text-slate-500">Choose an available web address to continue.</p>
        )}
      </div>
    </form>
  );
}
