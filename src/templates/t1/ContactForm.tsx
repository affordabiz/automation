"use client";

import { useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CircleCheck, Send } from "lucide-react";
import { btnPrimary } from "./theme";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-base text-slate-800 ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--t1-orange) sm:text-[0.95rem]";

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
      <p role="status" className="flex flex-col items-center gap-3 rounded-2xl bg-(--t1-mint) p-8 text-center text-lg font-semibold text-(--t1-teal)">
        <CircleCheck className="size-10 text-(--t1-orange)" aria-hidden />
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
        className={`${btnPrimary} w-full disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:px-10`}
      >
        {status === "sending" ? "Sending…" : "Submit"}
        <Send className="size-4" aria-hidden />
      </button>
    </form>
  );
}
