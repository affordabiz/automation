"use client";

import { useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-800 ring-1 ring-white/20 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-(--t1-orange)";

export function ContactForm({ slug }: { slug: string | null }) {
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
      <p role="status" className="rounded-2xl bg-white/10 p-6 text-center font-semibold">
        Thanks! Your message has been sent.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required maxLength={100} placeholder="Full Name" aria-label="Full Name" className={field} />
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder="Email Address"
          aria-label="Email Address"
          className={field}
        />
      </div>
      <input name="phone" type="tel" maxLength={30} placeholder="Phone" aria-label="Phone" className={field} />
      <textarea
        name="message"
        required
        maxLength={5000}
        rows={5}
        placeholder="Message"
        aria-label="Message"
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
        <p className="text-sm text-white/70">The contact form is disabled in preview.</p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-(--t1-orange)">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!slug || !token || status === "sending"}
        className="inline-flex items-center justify-center rounded-full bg-(--t1-orange) px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-(--t1-orange-deep) disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
