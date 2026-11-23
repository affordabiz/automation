"use client";

import { LoaderCircle, Send } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import type { EntryMessage } from "@/lib/entries/mapping";
import { Notice } from "../../../_components/forms";
import { markEntryReadAction, sendEntryMessageAction } from "../actions";

type Message = EntryMessage & { dateLabel: string };

function SendButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Send email to client"
      className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-700 text-white transition hover:bg-teal-800 disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
    </button>
  );
}

const STATUS_NOTE = { failed: "Email failed", not_sent: "Not emailed (dry-run)", sent: "Emailed" } as const;

export function Conversation(props: {
  entryId: string;
  clientName: string;
  clientEmail: string;
  canSend: boolean;
  repliesEnabled: boolean;
  messages: Message[];
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, sending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await sendEntryMessageAction(props.entryId, previous, data);
    // Keep the draft if it wasn't stored, so nothing the admin typed is lost.
    if (!result.error || result.saved) form.current?.reset();
    return result;
  }, {});
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
  const list = useRef<HTMLDivElement>(null);
  const hasUnread = props.messages.some((m) => m.direction === "inbound" && !m.read_at);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [props.messages.length]);

  useEffect(() => {
    if (hasUnread) void markEntryReadAction(props.entryId);
  }, [hasUnread, props.entryId]);

  return (
    <section aria-label="Client conversation" className="flex max-h-[42rem] min-h-[26rem] flex-col rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold">Conversation</h2>
        <p className="truncate text-xs text-slate-500">{props.clientName} · {props.clientEmail}</p>
      </header>

      <div ref={list} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
        {props.messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No messages yet. Email the client below.</p>
        ) : (
          props.messages.map((m) => {
            const outbound = m.direction === "outbound";
            return (
              <div key={m.id} className={`flex flex-col ${outbound ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${outbound ? "rounded-br-md bg-teal-700 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                  {m.body}
                </div>
                <p className={`mt-1 px-1 text-[11px] ${m.email_status === "failed" ? "text-red-600" : "text-slate-500"}`}>
                  {m.author_name} · {m.dateLabel} UTC{outbound && m.email_status ? ` · ${STATUS_NOTE[m.email_status]}` : ""}
                </p>
              </div>
            );
          })
        )}
      </div>

      {props.canSend ? (
        <form ref={form} onSubmit={submit} className="space-y-2 border-t border-slate-100 p-3">
          <Notice state={state} />
          <div className="flex items-end gap-2">
            <label htmlFor="message" className="sr-only">Message to client</label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={5000}
              rows={2}
              placeholder="Write an email to the client…"
              className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            />
            <SendButton pending={sending} />
          </div>
          {!props.repliesEnabled ? (
            <p className="text-xs text-slate-500">Client replies go to your sender inbox until a reply domain is connected.</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
