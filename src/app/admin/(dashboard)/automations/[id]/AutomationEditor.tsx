"use client";

import { ArrowDown, ArrowLeft, Clock, FileText, Filter, LoaderCircle, Mail, Plus, Power, Save, Send, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { labelsToTokens } from "@/lib/automations/render";
import {
  BUILT_IN_TOKENS,
  MAX_DELAY_MINUTES,
  MAX_STEPS,
  newStep,
  type AutomationDefinition,
  type AutomationStatus,
  type AutomationStep,
  type JobStatus,
} from "@/lib/automations/types";
import { CHOICE_TYPES, LOGIC_OPERATORS, type FieldOption, type FieldType, type LogicOperator, type LogicRule } from "@/lib/forms/types";
import { Notice } from "../../../_components/forms";
import { saveAutomationAction, sendTestEmailAction, setAutomationStatusAction } from "../actions";
import { STATUS_STYLES } from "../AutomationsList";

interface EditorField {
  id: string;
  type: FieldType;
  label: string;
  options?: FieldOption[];
}

interface Activity {
  id: string;
  toEmail: string;
  subject: string;
  status: JobStatus;
  error: string | null;
  dateLabel: string;
}

const control =
  "mt-1 block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:bg-slate-50";
const caption = "block text-xs font-medium text-slate-600";

const JOB_STYLES: Record<JobStatus, { label: string; style: string }> = {
  sent: { label: "Sent", style: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Scheduled", style: "bg-sky-50 text-sky-700" },
  processing: { label: "Sending", style: "bg-sky-50 text-sky-700" },
  not_sent: { label: "Dry-run", style: "bg-amber-50 text-amber-800" },
  failed: { label: "Failed", style: "bg-red-50 text-red-700" },
  skipped: { label: "Skipped", style: "bg-slate-100 text-slate-600" },
};

const UNITS = [
  { value: 1, label: "Minutes" },
  { value: 60, label: "Hours" },
  { value: 1440, label: "Days" },
];

function delayUnit(minutes: number) {
  if (minutes > 0 && minutes % 1440 === 0) return 1440;
  if (minutes > 0 && minutes % 60 === 0) return 60;
  return 1;
}

function DelayEditor({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const [unit, setUnit] = useState(() => delayUnit(minutes));
  const clamp = (value: number) => Math.min(MAX_DELAY_MINUTES, Math.max(0, Math.round(value)));
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <Clock className="size-4 text-slate-500" aria-hidden />
      <span className="text-sm font-medium text-slate-700">{minutes === 0 ? "Send immediately, or wait" : "Wait"}</span>
      <input type="number" min={0} aria-label="Delay amount" value={minutes / unit} onChange={(e) => onChange(clamp(Number(e.target.value) * unit))} className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-teal-700" />
      <select aria-label="Delay unit" value={unit} onChange={(e) => { const next = Number(e.target.value); setUnit(next); onChange(clamp((minutes / unit) * next)); }} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-teal-700">
        {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
      </select>
    </div>
  );
}

function VariableBar({ fields, onInsert }: { fields: EditorField[]; onInsert: (token: string) => void }) {
  const items = [...fields.filter((f) => f.type !== "file").map((f) => f.label), ...BUILT_IN_TOKENS.map((t) => t.label)];
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((label, index) => (
        <button key={`${label}-${index}`} type="button" onClick={() => onInsert(`{{${label}}}`)} className="max-w-40 truncate rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 transition hover:bg-violet-100">
          {label}
        </button>
      ))}
    </div>
  );
}

function StepCard({ step, index, fields, automationId, canRemove, onChange, onRemove }: {
  step: AutomationStep;
  index: number;
  fields: EditorField[];
  automationId: string;
  canRemove: boolean;
  onChange: (step: AutomationStep) => void;
  onRemove: () => void;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [testNotice, setTestNotice] = useState<ActionState>({});
  const [testing, startTest] = useTransition();
  const emailFields = fields.filter((f) => f.type === "email");
  const recipient = step.recipient;
  const [addressText, setAddressText] = useState(recipient.type === "custom" ? recipient.addresses.join(", ") : "");

  function insert(token: string) {
    const element = bodyRef.current;
    const start = element?.selectionStart ?? step.body.length;
    const end = element?.selectionEnd ?? step.body.length;
    onChange({ ...step, body: `${step.body.slice(0, start)}${token}${step.body.slice(end)}` });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function test() {
    setTestNotice({});
    startTest(async () => {
      try {
        setTestNotice(await sendTestEmailAction(automationId, labelsToTokens(step.subject, fields), labelsToTokens(step.body, fields)));
      } catch {
        setTestNotice({ error: "Couldn't send the test email." });
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-teal-50 text-teal-700"><Mail className="size-4" aria-hidden /></span>
          Email {index + 1}
        </h3>
        {canRemove ? (
          <button type="button" aria-label={`Remove email ${index + 1}`} onClick={onRemove} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="size-4" aria-hidden /></button>
        ) : null}
      </div>

      <DelayEditor minutes={step.delayMinutes} onChange={(delayMinutes) => onChange({ ...step, delayMinutes })} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={caption}>Send to</span>
          <select
            value={recipient.type}
            onChange={(e) => onChange({ ...step, recipient: e.target.value === "respondent" ? { type: "respondent", fieldId: emailFields[0]?.id ?? "" } : { type: "custom", addresses: [] } })}
            className={control}
          >
            <option value="respondent">Person who submitted</option>
            <option value="custom">Team or custom emails</option>
          </select>
        </label>
        {recipient.type === "respondent" ? (
          <label className="block">
            <span className={caption}>Email field</span>
            <select value={recipient.fieldId} onChange={(e) => onChange({ ...step, recipient: { type: "respondent", fieldId: e.target.value } })} className={control}>
              {emailFields.length === 0 ? <option value="">Add an email field to the form</option> : null}
              {emailFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className={caption}>Addresses, separated by commas</span>
            <input
              value={addressText}
              placeholder="team@example.com"
              onChange={(e) => {
                setAddressText(e.target.value);
                onChange({ ...step, recipient: { type: "custom", addresses: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) } });
              }}
              className={control}
            />
          </label>
        )}
      </div>

      <label className="block">
        <span className={caption}>Subject</span>
        <input value={step.subject} maxLength={200} placeholder="Thanks for reaching out, {{Full name}}" onChange={(e) => onChange({ ...step, subject: e.target.value })} className={control} />
      </label>
      <div>
        <label htmlFor={`body-${step.id}`} className={caption}>Message</label>
        <textarea id={`body-${step.id}`} ref={bodyRef} value={step.body} rows={6} maxLength={10000} placeholder="Write your email here." onChange={(e) => onChange({ ...step, body: e.target.value })} className={control} />
        <p className="mb-1 mt-2 text-xs text-slate-500">Insert a variable:</p>
        <VariableBar fields={fields} onInsert={insert} />
      </div>
      <Notice state={testNotice} />
      <button type="button" onClick={test} disabled={testing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
        {testing ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Send test to me
      </button>
    </div>
  );
}

function ConditionsCard({ definition, fields, onChange }: { definition: AutomationDefinition; fields: EditorField[]; onChange: (definition: AutomationDefinition) => void }) {
  const rules = definition.conditions;
  const blank = (): LogicRule => ({ fieldId: fields[0]?.id ?? "", operator: "equals", value: fields[0]?.options?.[0]?.id ?? "" });
  const update = (index: number, patch: Partial<LogicRule>) =>
    onChange({ ...definition, conditions: rules.map((r, i) => (i === index ? { ...r, ...patch } : r)) });

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-violet-50 text-violet-700"><Filter className="size-4" aria-hidden /></span>
          Conditions
        </h3>
        {rules.length > 1 ? (
          <select aria-label="Condition matching" value={definition.match} onChange={(e) => onChange({ ...definition, match: e.target.value as "all" | "any" })} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm">
            <option value="all">All must match</option>
            <option value="any">Any can match</option>
          </select>
        ) : null}
      </div>
      {rules.length === 0 ? <p className="text-sm text-slate-500">Runs for every submission.</p> : null}
      {rules.map((rule, index) => {
        const source = fields.find((f) => f.id === rule.fieldId);
        const unary = rule.operator === "is_empty" || rule.operator === "is_not_empty";
        return (
          <div key={index} className="grid gap-2 rounded-lg bg-violet-50/40 p-2.5 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <select aria-label="Question" value={rule.fieldId} onChange={(e) => update(index, { fieldId: e.target.value, value: fields.find((f) => f.id === e.target.value)?.options?.[0]?.id ?? "" })} className={`${control} mt-0`}>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.label.slice(0, 40)}</option>)}
            </select>
            <select aria-label="Condition" value={rule.operator} onChange={(e) => update(index, { operator: e.target.value as LogicOperator })} className={`${control} mt-0`}>
              {LOGIC_OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {unary ? <span /> : source && CHOICE_TYPES.includes(source.type) ? (
              <select aria-label="Value" value={rule.value} onChange={(e) => update(index, { value: e.target.value })} className={`${control} mt-0`}>
                {source.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            ) : (
              <input aria-label="Value" value={rule.value} maxLength={500} onChange={(e) => update(index, { value: e.target.value })} className={`${control} mt-0`} />
            )}
            <button type="button" aria-label="Remove condition" onClick={() => onChange({ ...definition, conditions: rules.filter((_, i) => i !== index) })} className="justify-self-end rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" aria-hidden /></button>
          </div>
        );
      })}
      {fields.length > 0 && rules.length < 10 ? (
        <button type="button" onClick={() => onChange({ ...definition, conditions: [...rules, blank()] })} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
          <Plus className="size-4" aria-hidden /> Add condition
        </button>
      ) : null}
    </div>
  );
}

const Connector = () => (
  <div className="flex justify-center py-1 text-slate-300" aria-hidden><ArrowDown className="size-5" /></div>
);

export function AutomationEditor(props: {
  id: string;
  initialName: string;
  status: AutomationStatus;
  formId: string;
  formName: string;
  formPublished: boolean;
  fields: EditorField[];
  initialDefinition: AutomationDefinition;
  activity: Activity[];
  canManage: boolean;
}) {
  const [name, setName] = useState(props.initialName);
  const [definition, setDefinition] = useState(props.initialDefinition);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<ActionState>({});
  const [pending, start] = useTransition();
  const status = STATUS_STYLES[props.status];
  const isActive = props.status === "active";

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(next: AutomationDefinition) {
    setDefinition(next);
    setDirty(true);
    setNotice({});
  }

  const stored = (): AutomationDefinition => ({
    ...definition,
    steps: definition.steps.map((s) => ({
      ...s,
      subject: labelsToTokens(s.subject, props.fields),
      body: labelsToTokens(s.body, props.fields),
    })),
  });

  const save = () => saveAutomationAction(props.id, { name, definition: stored() });

  function runSave() {
    setNotice({});
    start(async () => {
      try {
        const result = await save();
        if (!result.error) setDirty(false);
        setNotice(result);
      } catch {
        setNotice({ error: "Couldn't save. Your changes are still here, so try again." });
      }
    });
  }

  function toggle() {
    setNotice({});
    start(async () => {
      try {
        if (dirty) {
          const saved = await save();
          if (saved.error) return setNotice(saved);
          setDirty(false);
        }
        setNotice(await setAutomationStatusAction(props.id, isActive ? "paused" : "active"));
      } catch {
        setNotice({ error: "Couldn't update this automation." });
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
        <Link href="/admin/automations" aria-label="Back to automations" className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <label htmlFor="automation-title" className="sr-only">Automation name</label>
        <input
          id="automation-title"
          value={name}
          readOnly={!props.canManage}
          maxLength={100}
          onChange={(e) => { setName(e.target.value); setDirty(true); }}
          className="min-w-40 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold outline-none transition hover:border-slate-200 focus:border-teal-700"
        />
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.style}`}>{status.label}</span>
        {props.canManage ? (
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" onClick={runSave} disabled={pending || !dirty} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none">
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save
            </button>
            <button type="button" onClick={toggle} disabled={pending} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 sm:flex-none ${isActive ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100" : "bg-teal-700 text-white hover:bg-teal-800"}`}>
              <Power className="size-4" aria-hidden /> {isActive ? "Pause" : "Turn on"}
            </button>
          </div>
        ) : null}
      </div>

      <Notice state={notice} />

      {!props.formPublished ? (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This form is a draft. <Link href={`/admin/forms/${props.formId}`} className="font-semibold underline">Publish it</Link> before turning this automation on.
        </p>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <fieldset disabled={!props.canManage} className="min-w-0">
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-teal-700 text-white"><Zap className="size-4" aria-hidden /></span>
              When a form is submitted
            </h3>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-700"><FileText className="size-4 text-slate-500" aria-hidden /> {props.formName}</p>
          </div>
          <Connector />
          <ConditionsCard definition={definition} fields={props.fields} onChange={change} />
          {definition.steps.map((step, index) => (
            <div key={step.id}>
              <Connector />
              <StepCard
                step={step}
                index={index}
                fields={props.fields}
                automationId={props.id}
                canRemove={definition.steps.length > 1 || !isActive}
                onChange={(next) => change({ ...definition, steps: definition.steps.map((s) => (s.id === step.id ? next : s)) })}
                onRemove={() => change({ ...definition, steps: definition.steps.filter((s) => s.id !== step.id) })}
              />
            </div>
          ))}
          {definition.steps.length < MAX_STEPS ? (
            <>
              <Connector />
              <button
                type="button"
                onClick={() => {
                  const email = props.fields.find((f) => f.type === "email");
                  const step = newStep();
                  if (email) step.recipient = { type: "respondent", fieldId: email.id };
                  change({ ...definition, steps: [...definition.steps, step] });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-3.5 text-sm font-semibold text-teal-800 transition hover:border-teal-600 hover:bg-teal-50/40"
              >
                <Plus className="size-4" aria-hidden /> Add email
              </button>
            </>
          ) : null}
        </fieldset>

        <aside className="rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Email activity</h2>
          {props.activity.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No emails yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {props.activity.map((job) => {
                const style = JOB_STYLES[job.status];
                return (
                  <li key={job.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-slate-900">{job.subject}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.style}`}>{style.label}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{job.toEmail}</p>
                    <p className="text-xs text-slate-500">{job.dateLabel} UTC</p>
                    {job.error && job.status !== "sent" ? <p className="mt-0.5 text-xs text-slate-600">{job.error}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
