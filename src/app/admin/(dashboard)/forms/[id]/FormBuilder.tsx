"use client";

import {
  AlignLeft,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  Copy,
  EyeOff,
  FileUp,
  GitBranch,
  GripVertical,
  Globe,
  Hash,
  Heading,
  Link2,
  List,
  ListChecks,
  LoaderCircle,
  Mail,
  Minus,
  Phone,
  Pilcrow,
  Save,
  Settings2,
  SquareCheck,
  Star,
  Trash2,
  Type,
  Undo2,
  Eye,
  PencilRuler,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { PublicForm } from "@/components/forms/PublicForm";
import type { ActionState } from "@/lib/admin/actionState";
import type { FormStatus } from "@/lib/forms/store";
import { createField, FIELD_CATALOG, type FieldType, type FormField, type FormSchema } from "@/lib/forms/types";
import { Notice } from "../../../_components/forms";
import { publishFormAction, saveFormAction, unpublishFormAction } from "../actions";
import { FieldSettings, FormSettingsPanel } from "./BuilderPanels";

export const FIELD_ICONS: Record<FieldType, LucideIcon> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  phone: Phone,
  url: Link2,
  number: Hash,
  dropdown: List,
  radio: CircleDot,
  checkboxes: ListChecks,
  consent: SquareCheck,
  rating: Star,
  date: Calendar,
  time: Clock,
  datetime: CalendarClock,
  file: FileUp,
  hidden: EyeOff,
  heading: Heading,
  paragraph: Pilcrow,
  divider: Minus,
};

const GROUPS = [...new Set(FIELD_CATALOG.map((f) => f.group))];

function Palette({ onAdd, disabled }: { onAdd: (type: FieldType) => void; disabled: boolean }) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
            {FIELD_CATALOG.filter((f) => f.group === group).map((f) => {
              const Icon = FIELD_ICONS[f.type];
              return (
                <button
                  key={f.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAdd(f.type)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-teal-600 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon className="size-4 shrink-0 text-slate-500" aria-hidden />
                  <span className="truncate">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormBuilder(props: {
  id: string;
  initialName: string;
  initialSlug: string;
  initialSchema: FormSchema;
  status: FormStatus;
  hasUnpublishedChanges: boolean;
  canManage: boolean;
  canPublish: boolean;
  templates: number[];
}) {
  const [name, setName] = useState(props.initialName);
  const [slug, setSlug] = useState(props.initialSlug);
  const [schema, setSchema] = useState<FormSchema>(props.initialSchema);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"build" | "preview">("build");
  const [dirty, setDirty] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [notice, setNotice] = useState<ActionState>({});
  const [pending, start] = useTransition();
  const selected = schema.fields.find((f) => f.id === selectedId) ?? null;
  const readOnly = !props.canManage;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(next: FormSchema) {
    setSchema(next);
    setDirty(true);
    setNotice({});
  }

  const setFields = (fields: FormField[]) => change({ ...schema, fields });

  function addField(type: FieldType) {
    const field = createField(type);
    const index = selectedId ? schema.fields.findIndex((f) => f.id === selectedId) : -1;
    const fields = [...schema.fields];
    fields.splice(index >= 0 ? index + 1 : fields.length, 0, field);
    setFields(fields);
    setSelectedId(field.id);
  }

  function updateField(id: string, next: FormField) {
    setFields(schema.fields.map((f) => (f.id === id ? next : f)));
  }

  function removeField(id: string) {
    const fields = schema.fields
      .filter((f) => f.id !== id)
      .map((f) => {
        if (!f.logic?.rules.some((r) => r.fieldId === id)) return f;
        const rules = f.logic.rules.filter((r) => r.fieldId !== id);
        const { logic, ...rest } = f;
        return rules.length > 0 ? { ...rest, logic: { ...logic!, rules } } : rest;
      });
    const webpage = schema.settings.webpage;
    const map = webpage ? Object.fromEntries(Object.entries(webpage.map).filter(([, value]) => value !== id)) : null;
    change({ fields, settings: { ...schema.settings, ...(webpage ? { webpage: { ...webpage, map: map! } } : {}) } });
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateField(field: FormField) {
    const copy: FormField = { ...structuredClone(field), id: createField(field.type).id, label: `${field.label} copy`.slice(0, 500) };
    const fields = [...schema.fields];
    fields.splice(fields.findIndex((f) => f.id === field.id) + 1, 0, copy);
    setFields(fields);
    setSelectedId(copy.id);
  }

  function moveTo(id: string, target: number) {
    const from = schema.fields.findIndex((f) => f.id === id);
    if (from < 0 || target < 0 || target >= schema.fields.length || from === target) return;
    const fields = [...schema.fields];
    const [item] = fields.splice(from, 1);
    fields.splice(target, 0, item);
    setFields(fields);
  }

  const save = () => saveFormAction(props.id, { name, slug, schema });

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

  function runPublish() {
    setNotice({});
    start(async () => {
      try {
        if (dirty && props.canManage) {
          const saved = await save();
          if (saved.error) return setNotice(saved);
          setDirty(false);
        }
        setNotice(await publishFormAction(props.id));
      } catch {
        setNotice({ error: "Couldn't publish. Please try again." });
      }
    });
  }

  function runUnpublish() {
    setNotice({});
    start(async () => {
      try {
        setNotice(await unpublishFormAction(props.id));
      } catch {
        setNotice({ error: "Couldn't unpublish. Please try again." });
      }
    });
  }

  const isPublished = props.status === "published";
  const canRepublish = !isPublished || dirty || props.hasUnpublishedChanges;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor="form-title" className="sr-only">Form name</label>
          <input
            id="form-title"
            value={name}
            readOnly={readOnly}
            maxLength={100}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="w-full min-w-40 max-w-xs rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold outline-none transition hover:border-slate-200 focus:border-teal-700"
          />
          <span className={`hidden shrink-0 text-xs sm:inline ${dirty ? "text-amber-700" : "text-slate-500"}`} role="status">
            {dirty ? "Unsaved changes" : props.hasUnpublishedChanges ? "Saved, not published" : "All changes saved"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView(view === "build" ? "preview" : "build")}
            aria-pressed={view === "preview"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {view === "build" ? <Eye className="size-4" aria-hidden /> : <PencilRuler className="size-4" aria-hidden />}
            {view === "build" ? "Preview" : "Edit"}
          </button>
          {props.canManage ? (
            <button type="button" onClick={runSave} disabled={pending || !dirty} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save
            </button>
          ) : null}
          {props.canPublish && isPublished ? (
            <button type="button" onClick={runUnpublish} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
              <Undo2 className="size-4" aria-hidden /> Unpublish
            </button>
          ) : null}
          {props.canPublish ? (
            <button type="button" onClick={runPublish} disabled={pending || !canRepublish || (dirty && !props.canManage)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50">
              <Globe className="size-4" aria-hidden /> {isPublished ? "Update live form" : "Publish"}
            </button>
          ) : null}
        </div>
      </div>

      <Notice state={notice} />

      {view === "preview" ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Preview: validation and logic work, but nothing is submitted.</p>
          <PublicForm key={JSON.stringify(schema)} slug={slug} schema={schema} mode="preview" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)_21rem]">
          <aside className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <details open className="group lg:contents">
              <summary className="cursor-pointer list-none text-sm font-semibold lg:hidden">Add a field</summary>
              <div className="mt-3 lg:mt-0"><Palette onAdd={addField} disabled={readOnly} /></div>
            </details>
          </aside>

          <section aria-label="Form fields" className="min-h-96 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            {schema.fields.length === 0 ? (
              <div className="grid h-80 place-items-center rounded-xl border border-dashed border-slate-300 text-center">
                <div>
                  <PencilRuler className="mx-auto size-7 text-slate-400" aria-hidden />
                  <p className="mt-2 font-medium text-slate-700">Start building your form</p>
                  <p className="mt-0.5 text-sm text-slate-500">Choose a field to add it here.</p>
                </div>
              </div>
            ) : (
              <ol className="space-y-2">
                {schema.fields.map((field, index) => {
                  const Icon = FIELD_ICONS[field.type];
                  const active = field.id === selectedId;
                  return (
                    <li
                      key={field.id}
                      draggable={!readOnly}
                      onDragStart={() => setDragId(field.id)}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragId) moveTo(dragId, index);
                        setDragId(null);
                      }}
                      className={`group/field flex items-center gap-2 rounded-xl border p-2.5 transition ${active ? "border-teal-600 bg-teal-50/50 ring-1 ring-teal-600/30" : "border-slate-200 bg-white hover:border-slate-300"} ${dragId === field.id ? "opacity-40" : ""}`}
                    >
                      {!readOnly ? <GripVertical className="hidden size-4 shrink-0 cursor-grab text-slate-400 sm:block" aria-hidden /> : null}
                      <button type="button" onClick={() => setSelectedId(active ? null : field.id)} aria-pressed={active} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">
                            {field.type === "divider" ? "Divider" : field.label}
                            {field.required ? <span className="text-red-600"> *</span> : null}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            {FIELD_CATALOG.find((f) => f.type === field.type)?.label}
                            {field.width === "half" ? " · Half width" : ""}
                            {field.logic?.rules.length ? <span className="inline-flex items-center gap-0.5 text-violet-700"><GitBranch className="size-3" aria-hidden /> Logic</span> : null}
                          </span>
                        </span>
                      </button>
                      {!readOnly ? (
                        <div className="flex shrink-0 items-center">
                          <button type="button" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => moveTo(field.id, index - 1)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronUp className="size-4" aria-hidden /></button>
                          <button type="button" aria-label={`Move ${field.label} down`} disabled={index === schema.fields.length - 1} onClick={() => moveTo(field.id, index + 1)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="size-4" aria-hidden /></button>
                          <button type="button" aria-label={`Duplicate ${field.label}`} onClick={() => duplicateField(field)} className="hidden rounded-md p-1.5 text-slate-500 hover:bg-slate-100 sm:block"><Copy className="size-4" aria-hidden /></button>
                          <button type="button" aria-label={`Delete ${field.label}`} onClick={() => removeField(field.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="size-4" aria-hidden /></button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Settings2 className="size-4 text-slate-500" aria-hidden />
              <h2 className="text-sm font-semibold">{selected ? "Field settings" : "Form settings"}</h2>
              {selected ? <button type="button" onClick={() => setSelectedId(null)} className="ml-auto text-xs font-medium text-teal-800 hover:underline">Form settings</button> : null}
            </div>
            <fieldset disabled={readOnly} className="min-w-0 p-4">
              {selected ? (
                <FieldSettings key={selected.id} field={selected} fields={schema.fields} onChange={(next) => updateField(selected.id, next)} />
              ) : (
                <FormSettingsPanel
                  schema={schema}
                  slug={slug}
                  templates={props.templates}
                  onSlug={(value) => {
                    setSlug(value);
                    setDirty(true);
                  }}
                  onChange={change}
                />
              )}
            </fieldset>
          </aside>
        </div>
      )}
    </div>
  );
}
