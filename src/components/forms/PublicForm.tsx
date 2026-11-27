"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CircleCheck, ExternalLink, FileUp, LoaderCircle, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { allowedExtensions, validateField, validateForm, visibleFieldIds } from "@/lib/forms/engine";
import { DEFAULT_ACCENT, type FormField, type FormSchema, type FormValue, type FormValues } from "@/lib/forms/types";
import { useFormView } from "./useFormView";

const controlClass =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--form-accent)] focus:ring-2 focus:ring-[var(--form-accent)]/20 aria-[invalid=true]:border-red-500";

/** Fields whose question can sit inside the box when labels are hidden. */
const PLACEHOLDER_TYPES = new Set<FormField["type"]>(["short_text", "long_text", "email", "phone", "url", "number", "dropdown"]);

/** With "Hide labels" on, the label is visually hidden and the question moves into the placeholder. */
export function labelDisplay(field: FormField, hideLabels: boolean | undefined) {
  const hidden = Boolean(hideLabels) && PLACEHOLDER_TYPES.has(field.type);
  const shown = hidden ? { ...field, placeholder: `${field.label}${field.required ? " *" : ""}` } : field;
  return { hidden, field: shown, labelClass: hidden ? "sr-only" : "block text-sm font-medium text-slate-800" };
}

function initialValues(fields: readonly FormField[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    if (field.type === "checkboxes") values[field.id] = [];
    else if (field.type === "consent") values[field.id] = "false";
    else if (field.defaultValue) values[field.id] = field.defaultValue;
  }
  return values;
}

export function FieldControl({
  field,
  value,
  files,
  error,
  onChange,
  onFiles,
  onBlur,
}: {
  field: FormField;
  value: FormValue | undefined;
  files: File[];
  error?: string;
  onChange: (value: FormValue) => void;
  onFiles: (files: File[]) => void;
  onBlur: () => void;
}) {
  const id = `field-${field.id}`;
  const described = [field.helpText ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const text = typeof value === "string" ? value : "";
  const common = {
    id,
    name: field.id,
    required: field.required,
    placeholder: field.placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
    onBlur,
    className: controlClass,
  };

  switch (field.type) {
    case "long_text":
      return <textarea {...common} rows={4} value={text} maxLength={field.validation?.maxLength ?? 10000} onChange={(e) => onChange(e.target.value)} />;
    case "dropdown":
      return (
        <select {...common} value={text} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.placeholder || "Select an option"}</option>
          {field.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );
    case "radio":
    case "checkboxes": {
      const list = Array.isArray(value) ? value : [];
      return (
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role={field.type === "radio" ? "radiogroup" : "group"} aria-labelledby={`${id}-label`} aria-describedby={described}>
          {field.options?.map((o) => {
            const checked = field.type === "radio" ? text === o.id : list.includes(o.id);
            return (
              <label key={o.id} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? "border-[var(--form-accent)] bg-[var(--form-accent)]/5" : "border-slate-200 hover:border-slate-300"}`}>
                <input
                  type={field.type === "radio" ? "radio" : "checkbox"}
                  name={field.id}
                  value={o.id}
                  checked={checked}
                  onBlur={onBlur}
                  onChange={(e) => {
                    if (field.type === "radio") onChange(o.id);
                    else onChange(e.target.checked ? [...list, o.id] : list.filter((v) => v !== o.id));
                  }}
                  className="size-4 shrink-0 accent-[var(--form-accent)]"
                />
                <span className="min-w-0 break-words text-slate-800">{o.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "consent":
      return (
        <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-sm text-slate-800">
          <input id={id} type="checkbox" checked={value === "true"} aria-invalid={error ? true : undefined} aria-describedby={described} onBlur={onBlur} onChange={(e) => onChange(e.target.checked ? "true" : "false")} className="mt-0.5 size-4 shrink-0 accent-[var(--form-accent)]" />
          <span>{field.label}{field.required ? <span className="text-red-600"> *</span> : null}</span>
        </label>
      );
    case "rating": {
      const max = field.validation?.max ?? 5;
      return (
        <div className="mt-1.5 flex gap-1" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={described}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={Number(text) === n} aria-label={`${n} of ${max}`} onBlur={onBlur} onClick={() => onChange(String(n))} className="rounded p-1 transition hover:scale-110">
              <Star className={`size-7 ${Number(text) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
            </button>
          ))}
        </div>
      );
    }
    case "file": {
      const accept = Object.keys(allowedExtensions(field.validation?.fileGroups)).map((e) => `.${e}`).join(",");
      return (
        <div className="mt-1.5 space-y-2">
          <label className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-[var(--form-accent)]/30 ${error ? "border-red-500" : "border-slate-300"}`}>
            <FileUp className="size-5 text-slate-500" aria-hidden />
            <span className="text-sm font-medium text-slate-700">Choose {field.validation?.multiple ? "files" : "a file"}</span>
            <span className="text-xs text-slate-500">{accept.replaceAll(".", "").replaceAll(",", ", ").toUpperCase()} · up to 4 MB total</span>
            <input
              id={id}
              type="file"
              accept={accept}
              multiple={field.validation?.multiple}
              aria-invalid={error ? true : undefined}
              aria-describedby={described}
              className="sr-only"
              onChange={(e) => {
                const chosen = Array.from(e.target.files ?? []);
                onFiles(field.validation?.multiple ? [...files, ...chosen] : chosen);
                e.target.value = "";
              }}
            />
          </label>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-slate-700">{file.name}</span>
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onFiles(files.filter((_, i) => i !== index))} className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-200">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      );
    }
    default: {
      const types: Partial<Record<FormField["type"], string>> = { email: "email", phone: "tel", url: "url", number: "number", date: "date", time: "time", datetime: "datetime-local" };
      const v = field.validation;
      const dateLimits = field.type === "date" || field.type === "datetime" || field.type === "time" ? { min: v?.minDate, max: v?.maxDate } : {};
      const numberLimits = field.type === "number" ? { min: v?.min, max: v?.max, step: "any" } : {};
      return <input {...common} {...dateLimits} {...numberLimits} type={types[field.type] ?? "text"} value={text} maxLength={field.type === "number" ? undefined : v?.maxLength} onChange={(e) => onChange(e.target.value)} />;
    }
  }
}

export function PublicForm({
  slug,
  schema,
  mode = "page",
}: {
  slug: string;
  schema: FormSchema;
  mode?: "page" | "embed" | "preview";
}) {
  const { fields, settings } = schema;
  const [values, setValues] = useState<FormValues>(() => initialValues(fields));
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ webpageUrl?: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const visible = useMemo(() => visibleFieldIds(fields, values), [fields, values]);
  const preview = mode === "preview";
  useFormView(slug, !preview);

  useEffect(() => {
    if (mode !== "embed" || !root.current) return;
    const send = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent.postMessage({ type: "affordabiz-form-height", slug, height }, "*");
    };
    const observer = new ResizeObserver(send);
    observer.observe(root.current);
    send();
    return () => observer.disconnect();
  }, [mode, slug, done]);

  function focusField(id: string) {
    const element = document.getElementById(`field-${id}`) ?? document.querySelector<HTMLElement>(`[name="${id}"]`);
    element?.focus();
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function clearError(id: string) {
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function blur(field: FormField) {
    const error = validateField(field, values[field.id], files[field.id] ?? []);
    setErrors((current) => {
      const next = { ...current };
      if (error) next[field.id] = error;
      else delete next[field.id];
      return next;
    });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const result = validateForm(fields, values, files);
    setErrors(result.errors);
    const firstError = fields.find((f) => result.errors[f.id]);
    if (firstError) {
      focusField(firstError.id);
      return;
    }
    if (preview) {
      setDone({});
      return;
    }

    const body = new FormData();
    for (const field of fields) {
      if (!result.visible.has(field.id)) continue;
      if (field.type === "file") (files[field.id] ?? []).forEach((file) => body.append(field.id, file));
      else {
        const value = values[field.id];
        if (Array.isArray(value)) value.forEach((item) => body.append(field.id, item));
        else if (value !== undefined) body.set(field.id, value);
      }
    }
    body.set("cf-turnstile-response", token);
    body.set("source", mode === "embed" ? "embed" : "link");
    const honeypot = e.currentTarget.elements.namedItem("company_website") as HTMLInputElement | null;
    if (honeypot?.value) body.set("company_website", honeypot.value);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(slug)}/submit`, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { errors?: Record<string, string>; error?: string; webpageUrl?: string };
      if (res.ok) {
        if (settings.redirectUrl) {
          (mode === "embed" ? window.top ?? window : window).location.href = settings.redirectUrl;
          return;
        }
        setDone({ webpageUrl: data.webpageUrl });
        return;
      }
      if (data.errors) {
        setErrors(data.errors);
        const first = fields.find((f) => data.errors?.[f.id]);
        if (first) focusField(first.id);
      }
      setFormError(data.error ?? (data.errors ? "Please fix the highlighted fields." : "We couldn't submit this form."));
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
      turnstile.current?.reset();
      setToken("");
    }
  }

  const style = { "--form-accent": settings.accentColor || DEFAULT_ACCENT } as CSSProperties;

  if (done) {
    return (
      <div ref={root} style={style} className="px-2 py-12 text-center">
        <CircleCheck className="mx-auto size-12 text-[var(--form-accent)]" aria-hidden />
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">{settings.successTitle || "Thank you!"}</h2>
        <p className="mx-auto mt-2 max-w-md whitespace-pre-wrap text-slate-600">{settings.successMessage || "Your response has been submitted."}</p>
        {done.webpageUrl ? (
          <a href={done.webpageUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--form-accent)] px-5 py-2.5 text-sm font-semibold text-white">
            View your webpage <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
        {preview ? (
          <button type="button" onClick={() => setDone(null)} className="mt-5 block w-full text-sm font-medium text-slate-600 underline">Back to the form</button>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={root} style={style}>
      {settings.title || settings.description ? (
        <header className="mb-6">
          {settings.title ? <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{settings.title}</h1> : null}
          {settings.description ? <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-600">{settings.description}</p> : null}
        </header>
      ) : null}

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {fields.map((field) => {
            if (!visible.has(field.id) || field.type === "hidden") return null;
            const span = field.width === "half" ? "" : "sm:col-span-2";
            if (field.type === "heading") return <h2 key={field.id} className="pt-2 text-lg font-semibold text-slate-900 sm:col-span-2">{field.label}</h2>;
            if (field.type === "paragraph") return <p key={field.id} className="whitespace-pre-wrap text-sm text-slate-600 sm:col-span-2">{field.label}</p>;
            if (field.type === "divider") return <hr key={field.id} className="border-slate-200 sm:col-span-2" />;
            const id = `field-${field.id}`;
            const error = errors[field.id];
            const labelable = !["radio", "checkboxes", "rating", "consent"].includes(field.type);
            const display = labelDisplay(field, settings.hideLabels);
            return (
              <div key={field.id} className={`min-w-0 ${span}`}>
                {field.type !== "consent" ? (
                  labelable ? (
                    <label id={`${id}-label`} htmlFor={id} className={display.labelClass}>
                      {field.label}{field.required ? <span className="text-red-600"> *</span> : null}
                    </label>
                  ) : (
                    <p id={`${id}-label`} className="text-sm font-medium text-slate-800">
                      {field.label}{field.required ? <span className="text-red-600"> *</span> : null}
                    </p>
                  )
                ) : null}
                <FieldControl
                  field={display.field}
                  value={values[field.id]}
                  files={files[field.id] ?? []}
                  error={error}
                  onBlur={() => blur(field)}
                  onChange={(value) => {
                    setValues((current) => ({ ...current, [field.id]: value }));
                    clearError(field.id);
                  }}
                  onFiles={(chosen) => {
                    setFiles((current) => ({ ...current, [field.id]: chosen }));
                    const problem = validateField(field, undefined, chosen);
                    setErrors((current) => {
                      const next = { ...current };
                      if (problem) next[field.id] = problem;
                      else delete next[field.id];
                      return next;
                    });
                  }}
                />
                {field.helpText ? <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">{field.helpText}</p> : null}
                {error ? <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p> : null}
              </div>
            );
          })}
        </div>

        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

        {!preview ? (
          <Turnstile
            ref={turnstile}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
            onSuccess={setToken}
            onExpire={() => setToken("")}
          />
        ) : null}
        {formError ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p> : null}
        <button
          type="submit"
          disabled={submitting || (!preview && !token)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--form-accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {submitting ? "Submitting…" : settings.submitLabel || "Submit"}
        </button>
      </form>
    </div>
  );
}
