"use client";

import { useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CircleCheck, Send } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

/** Per-template styling and field wording for the shared contact form. */
export interface ContactFormStyle {
  field: string;
  button: string;
  success: string;
  successIcon: string;
  /** Placeholder text per field, matching each template's reference. Omit `phone` to hide that field. */
  labels?: { name: string; email: string; phone?: string; message: string; submit: string };
}

const DEFAULT_LABELS = { name: "Full Name", email: "Email Address", phone: "Phone", message: "Message", submit: "Submit" };

export function ContactForm({ slug, styles }: { slug: string | null; styles: ContactFormStyle }) {
  const labels = styles.labels ?? DEFAULT_LABELS;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const turnstile = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug) return;
    const form = e.currentTarget;
    setStatus("sending");
    setError(null);
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch(`/api/contact/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, turnstileToken: token }),
    }).catch(() => null);
    const body = ((await res?.json().catch(() => ({}))) ?? {}) as {
      error?: string;
      errors?: Record<string, string[]>;
    };
    turnstile.current?.reset();
    setToken("");
    if (res?.ok) {
      form.reset();
      setStatus("sent");
      return;
    }
    setStatus("error");
    setError(
      body.errors
        ? (Object.values(body.errors).flat()[0] ?? "Please check the form.")
        : (body.error ?? "Something went wrong. Please try again."),
    );
  }

  if (status === "sent") {
    return (
      <p role="status" className={styles.success}>
        <CircleCheck className={styles.successIcon} aria-hidden />
        Thanks! Your message has been sent.
      </p>
    );
  }

  const field = styles.field;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required maxLength={100} placeholder={labels.name} aria-label={labels.name} className={field} />
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder={labels.email}
          aria-label={labels.email}
          className={field}
        />
      </div>
      {labels.phone && (
        <input name="phone" type="tel" maxLength={30} placeholder={labels.phone} aria-label={labels.phone} className={field} />
      )}
      <textarea
        name="message"
        required
        maxLength={5000}
        rows={5}
        placeholder={labels.message}
        aria-label={labels.message}
        className={field}
      />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {slug ? (
        <Turnstile
          ref={turnstile}
          siteKey={siteKey}
          onSuccess={setToken}
          onExpire={() => setToken("")}
          options={{ theme: "light" }}
        />
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">The contact form is disabled in preview.</p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!slug || !token || status === "sending"}
        className={`${styles.button} w-full disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:px-10`}
      >
        {status === "sending" ? "Sending…" : labels.submit}
        <Send className="size-4" aria-hidden />
      </button>
    </form>
  );
}
