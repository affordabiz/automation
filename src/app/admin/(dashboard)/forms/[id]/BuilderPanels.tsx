"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { isInputField } from "@/lib/forms/engine";
import {
  CHOICE_TYPES,
  createField,
  DEFAULT_ACCENT,
  FILE_GROUPS,
  LAYOUT_TYPES,
  LOGIC_OPERATORS,
  newOption,
  WEBPAGE_SLOTS,
  type FieldLogic,
  type FieldType,
  type FieldValidation,
  type FileGroup,
  type FormField,
  type FormSchema,
  type FormSettings,
  type LogicOperator,
  type LogicRule,
  type WebpageSlot,
} from "@/lib/forms/types";

const control =
  "mt-1.5 block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50";
const caption = "block text-xs font-semibold text-slate-600";

function Text({ label, value, onChange, placeholder, type = "text", max = 500, area }: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  max?: number;
  area?: boolean;
}) {
  return (
    <label className="block">
      <span className={caption}>{label}</span>
      {area ? (
        <textarea rows={3} maxLength={max} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={control} />
      ) : (
        <input type={type} maxLength={type === "text" ? max : undefined} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={control} />
      )}
    </label>
  );
}

function NumberInput({ label, value, onChange, min }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; min?: number }) {
  return (
    <label className="block min-w-0">
      <span className={caption}>{label}</span>
      <input
        type="number"
        min={min}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" || !Number.isFinite(Number(e.target.value)) ? undefined : Number(e.target.value))}
        className={control}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="relative h-5 w-9 shrink-0">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer absolute inset-0 z-10 cursor-pointer opacity-0" />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-teal-600 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-700/40" />
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      {title ? <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3> : null}
      {children}
    </div>
  );
}

function clean<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined && v !== "");
  return entries.length > 0 ? (Object.fromEntries(entries) as T) : undefined;
}

function ChoiceOptions({ field, onChange }: { field: FormField; onChange: (field: FormField) => void }) {
  const options = field.options ?? [];
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <Section title="Options">
      <ul className="space-y-1.5">
        {options.map((option, index) => (
          <li
            key={option.id}
            draggable
            onDragStart={() => setDrag(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag === null || drag === index) return;
              const next = [...options];
              const [item] = next.splice(drag, 1);
              next.splice(index, 0, item);
              onChange({ ...field, options: next });
              setDrag(null);
            }}
            className="flex items-center gap-1"
          >
            <GripVertical className="size-4 shrink-0 cursor-grab text-slate-400" aria-hidden />
            <input
              aria-label={`Option ${index + 1}`}
              maxLength={200}
              value={option.label}
              onChange={(e) => onChange({ ...field, options: options.map((o) => (o.id === option.id ? { ...o, label: e.target.value } : o)) })}
              className={`${control} mt-0`}
            />
            <button type="button" aria-label={`Remove option ${index + 1}`} disabled={options.length <= 1} onClick={() => onChange({ ...field, options: options.filter((o) => o.id !== option.id) })} className="shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onChange({ ...field, options: [...options, newOption(`Option ${options.length + 1}`)] })} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
        <Plus className="size-4" aria-hidden /> Add option
      </button>
    </Section>
  );
}

function ValidationSettings({ field, onChange }: { field: FormField; onChange: (field: FormField) => void }) {
  const v = field.validation ?? {};
  const set = (patch: Partial<FieldValidation>) => onChange({ ...field, validation: clean({ ...v, ...patch }) });
  const t = field.type;
  const textual = (["short_text", "long_text", "email", "phone", "url"] as FieldType[]).includes(t);
  const dated = t === "date" || t === "time" || t === "datetime";
  const dateType = t === "datetime" ? "datetime-local" : t;

  return (
    <div className="space-y-3">
      <Toggle label="Required" checked={Boolean(field.required)} onChange={(required) => onChange({ ...field, required: required || undefined })} />
      {field.required ? <Text label="Required error message" value={field.requiredMessage} max={200} placeholder="This field is required." onChange={(requiredMessage) => onChange({ ...field, requiredMessage: requiredMessage || undefined })} /> : null}

      {textual ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Min characters" min={0} value={v.minLength} onChange={(minLength) => set({ minLength })} />
            <NumberInput label="Max characters" min={0} value={v.maxLength} onChange={(maxLength) => set({ maxLength })} />
          </div>
          <Text label="Format pattern (regex)" value={v.pattern} max={200} placeholder="^\d{5}$" onChange={(pattern) => set({ pattern })} />
          {v.pattern ? <Text label="Pattern error message" value={v.patternMessage} max={200} placeholder="Enter a value in the correct format." onChange={(patternMessage) => set({ patternMessage })} /> : null}
        </>
      ) : null}

      {t === "number" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Minimum" value={v.min} onChange={(min) => set({ min })} />
          <NumberInput label="Maximum" value={v.max} onChange={(max) => set({ max })} />
        </div>
      ) : null}

      {t === "rating" ? (
        <label className="block">
          <span className={caption}>Stars</span>
          <select value={v.max ?? 5} onChange={(e) => set({ max: Number(e.target.value) })} className={control}>
            {[3, 4, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      ) : null}

      {t === "checkboxes" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Min selected" min={0} value={v.minSelected} onChange={(minSelected) => set({ minSelected })} />
          <NumberInput label="Max selected" min={0} value={v.maxSelected} onChange={(maxSelected) => set({ maxSelected })} />
        </div>
      ) : null}

      {dated ? (
        <div className="grid gap-2">
          <Text label="Earliest" type={dateType} value={v.minDate} onChange={(minDate) => set({ minDate })} />
          <Text label="Latest" type={dateType} value={v.maxDate} onChange={(maxDate) => set({ maxDate })} />
        </div>
      ) : null}

      {t === "file" ? (
        <>
          <Toggle label="Allow multiple files" checked={Boolean(v.multiple)} onChange={(multiple) => set({ multiple: multiple || undefined })} />
          <div>
            <p className={caption}>Allowed file types</p>
            <div className="mt-1.5 space-y-1">
              {(Object.keys(FILE_GROUPS) as FileGroup[]).map((group) => {
                const groups = v.fileGroups ?? [];
                return (
                  <label key={group} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={groups.includes(group)}
                      onChange={(e) => {
                        const next = e.target.checked ? [...groups, group] : groups.filter((g) => g !== group);
                        if (next.length > 0) set({ fileGroups: next });
                      }}
                      className="size-4 accent-teal-600"
                    />
                    {FILE_GROUPS[group].label}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">All files in one response can total up to 4 MB.</p>
          </div>
        </>
      ) : null}

      {t !== "consent" ? <Text label="Invalid answer message" value={field.invalidMessage} max={200} placeholder="Uses a helpful default" onChange={(invalidMessage) => onChange({ ...field, invalidMessage: invalidMessage || undefined })} /> : null}
    </div>
  );
}

function LogicSettings({ field, fields, onChange }: { field: FormField; fields: FormField[]; onChange: (field: FormField) => void }) {
  const position = fields.findIndex((f) => f.id === field.id);
  const sources = fields.slice(0, position).filter(isInputField);
  const logic = field.logic;

  function setLogic(next: FieldLogic | undefined) {
    const { logic: _previous, ...rest } = field;
    void _previous;
    onChange(next && next.rules.length > 0 ? { ...rest, logic: next } : rest);
  }

  if (sources.length === 0) {
    return <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">Add a question above this field to use conditional logic.</p>;
  }
  const newRule = (): LogicRule => ({ fieldId: sources[0].id, operator: "equals", value: sources[0].options?.[0]?.id ?? "" });

  if (!logic) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-600">Show or hide this field based on earlier answers.</p>
        <button type="button" onClick={() => setLogic({ action: "show", match: "all", rules: [newRule()] })} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
          <Plus className="size-4" aria-hidden /> Add condition
        </button>
      </div>
    );
  }

  const updateRule = (index: number, patch: Partial<LogicRule>) =>
    setLogic({ ...logic, rules: logic.rules.map((r, i) => (i === index ? { ...r, ...patch } : r)) });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className={caption}>Action</span>
          <select value={logic.action} onChange={(e) => setLogic({ ...logic, action: e.target.value as FieldLogic["action"] })} className={control}>
            <option value="show">Show field</option>
            <option value="hide">Hide field</option>
          </select>
        </label>
        <label className="block">
          <span className={caption}>When</span>
          <select value={logic.match} onChange={(e) => setLogic({ ...logic, match: e.target.value as FieldLogic["match"] })} className={control}>
            <option value="all">All match</option>
            <option value="any">Any match</option>
          </select>
        </label>
      </div>
      {logic.rules.map((rule, index) => {
        const source = fields.find((f) => f.id === rule.fieldId);
        const unary = rule.operator === "is_empty" || rule.operator === "is_not_empty";
        return (
          <div key={index} className="space-y-1.5 rounded-lg border border-violet-200 bg-violet-50/40 p-2.5">
            <div className="flex items-center gap-1">
              <select aria-label="Question" value={rule.fieldId} onChange={(e) => {
                const next = fields.find((f) => f.id === e.target.value);
                updateRule(index, { fieldId: e.target.value, value: next?.options?.[0]?.id ?? "" });
              }} className={`${control} mt-0`}>
                {sources.map((s) => <option key={s.id} value={s.id}>{s.label.slice(0, 40)}</option>)}
              </select>
              <button type="button" aria-label="Remove condition" onClick={() => setLogic({ ...logic, rules: logic.rules.filter((_, i) => i !== index) })} className="shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <select aria-label="Condition" value={rule.operator} onChange={(e) => updateRule(index, { operator: e.target.value as LogicOperator })} className={`${control} mt-0`}>
              {LOGIC_OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!unary ? (
              source && CHOICE_TYPES.includes(source.type) ? (
                <select aria-label="Value" value={rule.value} onChange={(e) => updateRule(index, { value: e.target.value })} className={`${control} mt-0`}>
                  {source.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              ) : source?.type === "consent" ? (
                <select aria-label="Value" value={rule.value} onChange={(e) => updateRule(index, { value: e.target.value })} className={`${control} mt-0`}>
                  <option value="true">Checked</option>
                  <option value="false">Not checked</option>
                </select>
              ) : (
                <input aria-label="Value" maxLength={500} value={rule.value} onChange={(e) => updateRule(index, { value: e.target.value })} className={`${control} mt-0`} />
              )
            ) : null}
          </div>
        );
      })}
      {logic.rules.length < 10 ? (
        <button type="button" onClick={() => setLogic({ ...logic, rules: [...logic.rules, newRule()] })} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
          <Plus className="size-4" aria-hidden /> Add condition
        </button>
      ) : null}
    </div>
  );
}

export function FieldSettings({ field, fields, onChange }: { field: FormField; fields: FormField[]; onChange: (field: FormField) => void }) {
  const [tab, setTab] = useState<"general" | "validation" | "logic">("general");
  const layout = LAYOUT_TYPES.includes(field.type);
  const hidden = field.type === "hidden";
  const tabs = [
    { id: "general" as const, label: "General" },
    ...(!layout && !hidden ? [{ id: "validation" as const, label: "Validation" }] : []),
    { id: "logic" as const, label: "Logic" },
  ];
  const placeholderTypes: FieldType[] = ["short_text", "long_text", "email", "phone", "url", "number", "dropdown"];

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Field settings" className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {t.label}
            {t.id === "logic" && field.logic?.rules.length ? " •" : ""}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="space-y-3">
          {field.type !== "divider" ? (
            <Text label={layout ? "Text" : "Label"} area={field.type === "paragraph"} value={field.label} onChange={(label) => onChange({ ...field, label })} />
          ) : (
            <p className="text-sm text-slate-600">A divider separates sections of your form.</p>
          )}
          {placeholderTypes.includes(field.type) ? <Text label="Placeholder" max={200} value={field.placeholder} onChange={(placeholder) => onChange({ ...field, placeholder: placeholder || undefined })} /> : null}
          {hidden ? <Text label="Value" max={1000} value={field.defaultValue} onChange={(defaultValue) => onChange({ ...field, defaultValue: defaultValue || undefined })} /> : null}
          {!layout && !hidden ? (
            <label className="block">
              <span className={caption}>Width</span>
              <select value={field.width ?? "full"} onChange={(e) => onChange({ ...field, width: e.target.value as "full" | "half" })} className={control}>
                <option value="full">Full width</option>
                <option value="half">Half width</option>
              </select>
            </label>
          ) : null}
          {CHOICE_TYPES.includes(field.type) ? <ChoiceOptions field={field} onChange={onChange} /> : null}
        </div>
      ) : null}
      {tab === "validation" ? <ValidationSettings field={field} onChange={onChange} /> : null}
      {tab === "logic" ? <LogicSettings field={field} fields={fields} onChange={onChange} /> : null}
    </div>
  );
}

const WEBPAGE_FIELD_TYPES: Record<WebpageSlot, FieldType> = {
  fullName: "short_text",
  businessName: "short_text",
  email: "email",
  phone: "phone",
  address: "long_text",
  servingArea: "short_text",
  slug: "short_text",
  logo: "file",
  photo: "file",
};

export type FormSettingsTab = "content" | "submit" | "link";

export function FormSettingsPanel({ tab, schema, slug, templates, onSlug, onChange }: {
  tab: FormSettingsTab;
  schema: FormSchema;
  slug: string;
  templates: number[];
  onSlug: (slug: string) => void;
  onChange: (schema: FormSchema) => void;
}) {
  const s = schema.settings;
  const set = (patch: Partial<FormSettings>) => {
    const next = { ...s, ...patch };
    onChange({ ...schema, settings: Object.fromEntries(Object.entries(next).filter(([, v]) => v !== "" && v !== undefined)) as FormSettings });
  };
  const webpage = s.webpage ?? null;

  function addWebpageFields() {
    if (!webpage) return;
    const fields = [...schema.fields];
    const map = { ...webpage.map };
    for (const slot of WEBPAGE_SLOTS) {
      if (map[slot.key]) continue;
      const field = createField(WEBPAGE_FIELD_TYPES[slot.key]);
      field.label = slot.label;
      field.required = true;
      if (field.type === "file") field.validation = { fileGroups: ["images"], multiple: false };
      if (slot.key === "slug") {
        field.validation = { pattern: "^[a-z0-9-]{3,50}$", patternMessage: "Use 3–50 lowercase letters, numbers or hyphens." };
      }
      fields.push(field);
      map[slot.key] = field.id;
    }
    onChange({ fields, settings: { ...s, webpage: { ...webpage, map } } });
  }

  return (
    <div className="space-y-4">
      {tab === "content" ? (
      <Section>
        <Text label="Title" max={150} value={s.title} onChange={(title) => set({ title })} />
        <Text label="Description" area max={1000} value={s.description} onChange={(description) => set({ description })} />
        <Text label="Submit button" max={50} placeholder="Submit" value={s.submitLabel} onChange={(submitLabel) => set({ submitLabel })} />
        <div>
          <Toggle label="Hide labels" checked={Boolean(s.hideLabels)} onChange={(hideLabels) => set({ hideLabels: hideLabels || undefined })} />
          <p className="text-xs text-slate-500">Questions show inside each box instead of above it.</p>
        </div>
        <label className="block">
          <span className={caption}>Accent color</span>
          <span className="mt-1 flex items-center gap-2">
            <input type="color" aria-label="Accent color" value={s.accentColor ?? DEFAULT_ACCENT} onChange={(e) => set({ accentColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
            <span className="font-mono text-xs text-slate-500">{s.accentColor ?? DEFAULT_ACCENT}</span>
          </span>
        </label>
      </Section>
      ) : null}

      {tab === "submit" ? (
      <Section>
        <Text label="Success title" max={120} placeholder="Thank you!" value={s.successTitle} onChange={(successTitle) => set({ successTitle })} />
        <Text label="Success message" area max={1000} placeholder="Your response has been submitted." value={s.successMessage} onChange={(successMessage) => set({ successMessage })} />
        <Text label="Redirect URL (optional)" max={1000} placeholder="https://example.com/thanks" value={s.redirectUrl} onChange={(redirectUrl) => set({ redirectUrl })} />
      </Section>
      ) : null}

      {tab === "link" ? (
      <>
      <Section title="Public link">
        <Text label="Link name" max={50} value={slug} onChange={(value) => onSlug(value.toLowerCase().replace(/\s+/g, "-"))} />
        <p className="break-all font-mono text-xs text-slate-500">/f/{slug}</p>
      </Section>

      <Section title="Create a webpage">
        <Toggle
          label="Link to a template"
          checked={Boolean(webpage)}
          onChange={(on) => set({ webpage: on ? { templateNumber: templates[0] ?? 1, map: {} } : undefined })}
        />
        {webpage ? (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500">Each response becomes an Entry and follows your review or auto-publish setting.</p>
            <label className="block">
              <span className={caption}>Template</span>
              <select value={webpage.templateNumber} onChange={(e) => set({ webpage: { ...webpage, templateNumber: Number(e.target.value) } })} className={control}>
                {templates.map((n) => <option key={n} value={n}>Template {n}</option>)}
              </select>
            </label>
            {WEBPAGE_SLOTS.some((slot) => !webpage.map[slot.key]) ? (
              <button type="button" onClick={addWebpageFields} className="w-full rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100">
                Add missing fields
              </button>
            ) : null}
            {WEBPAGE_SLOTS.map((slot) => (
              <label key={slot.key} className="block">
                <span className={caption}>{slot.label}</span>
                <select
                  value={webpage.map[slot.key] ?? ""}
                  onChange={(e) => {
                    const map = { ...webpage.map };
                    if (e.target.value) map[slot.key] = e.target.value;
                    else delete map[slot.key];
                    set({ webpage: { ...webpage, map } });
                  }}
                  className={control}
                >
                  <option value="">Not connected</option>
                  {schema.fields.filter((f) => (slot.types as readonly FieldType[]).includes(f.type)).map((f) => (
                    <option key={f.id} value={f.id}>{f.label.slice(0, 40)}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
      </Section>
      </>
      ) : null}
    </div>
  );
}
