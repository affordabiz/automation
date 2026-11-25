"use client";

import { useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CircleCheck } from "lucide-react";
import { btnRed } from "./theme";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-md border-0 bg-white/35 px-4 py-3.5 text-[0.95rem] text-(--t5-ink) ring-1 ring-inset ring-black/5 transition placeholder:text-[#4a4a4a] focus:bg-white/60 focus:outline-2 focus:outline-(--t5-slate)";

/** The hero "Schedule A Free Consultation" form. Requests reach the client by email like the contact form. */
export function BookingForm({ slug, services }: { slug: string | null; services: readonly string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const turnstile = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) ?? "").trim();
    const email = value("email");
    // The contact route needs a name and a message; this form asks for neither, so build them.
    const message = [
      "Schedule A Free Consultation",
      `Date From: ${value("dateFrom") || "-"}`,
      `Date To: ${value("dateTo") || "-"}`,
      `Type of Service: ${value("service") || "-"}`,
      `Other Details: ${value("details") || "-"}`,
    ].join("\n");

    setStatus("sending");
    setError(null);
    const res = await fetch(`/api/contact/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: email, email, message, website: value("website"), turnstileToken: token }),
    }).catch(() => null);
    const body = ((await res?.json().catch(() => ({}))) ?? {}) as { error?: string; errors?: Record<string, string[]> };
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
      <p role="status" className="flex flex-col items-center gap-3 rounded-md bg-white/50 p-8 text-center text-lg font-semibold text-(--t5-slate)">
        <CircleCheck className="size-10" aria-hidden />
        Thanks! Your message has been sent.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <input name="email" type="email" required maxLength={254} placeholder="Email Address" aria-label="Email Address" className={field} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <input name="dateFrom" maxLength={40} placeholder="Date From (format mm/dd/yy)" aria-label="Date From (format mm/dd/yy)" className={field} />
        <input name="dateTo" maxLength={40} placeholder="Date To (format mm/dd/yy)" aria-label="Date To (format mm/dd/yy)" className={field} />
      </div>
      <select name="service" defaultValue="" aria-label="Type of Service" className={`${field} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%233A506B%22><path d=%22M5 7l5 6 5-6z%22/></svg>')] bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-10 [&>option]:text-black`}>
        <option value="" disabled>
          Type of Service
        </option>
        {services.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <textarea name="details" maxLength={4000} rows={4} placeholder="Other Details" aria-label="Other Details" className={field} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {slug ? (
        <Turnstile ref={turnstile} siteKey={siteKey} onSuccess={setToken} onExpire={() => setToken("")} options={{ theme: "light" }} />
      ) : (
        <p className="rounded-md bg-white/40 px-4 py-3 text-sm text-[#333]">The contact form is disabled in preview.</p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-white px-4 py-3 text-sm font-medium text-(--t5-red)">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={!slug || !token || status === "sending"} className={`${btnRed} min-w-36 bg-white! text-(--t5-ink)! hover:bg-(--t5-slate)! hover:text-white! disabled:pointer-events-none disabled:opacity-60`}>
          {status === "sending" ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
