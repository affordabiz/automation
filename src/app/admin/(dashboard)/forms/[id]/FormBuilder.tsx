"use client";

import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarClock,
  CircleDot,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileUp,
  GitBranch,
  Globe,
  GripVertical,
  Hash,
  Heading,
  Link2,
  List,
  ListChecks,
  LoaderCircle,
  Mail,
  Minus,
  MousePointerClick,
  PencilRuler,
  Phone,
  Pilcrow,
  Plus,
  Save,
  SlidersHorizontal,
  SquareCheck,
  Star,
  Trash2,
  Type,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { FieldControl, labelDisplay, PublicForm } from "@/components/forms/PublicForm";
import type { ActionState } from "@/lib/admin/actionState";
import type { FormStatus } from "@/lib/forms/store";
import { createField, DEFAULT_ACCENT, FIELD_CATALOG, type FieldType, type FormField, type FormSchema } from "@/lib/forms/types";
import { Notice } from "../../../_components/forms";
import { publishFormAction, saveFormAction, unpublishFormAction } from "../actions";
import { FieldSettings, FormSettingsPanel, type FormSettingsTab } from "./BuilderPanels";

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

/** One soft colour per field group, used for the type chips. */
const GROUP_COLORS: Record<string, string> = {
  Text: "bg-sky-50 text-sky-600 ring-sky-100",
  Choice: "bg-violet-50 text-violet-600 ring-violet-100",
  "Date & time": "bg-amber-50 text-amber-600 ring-amber-100",
  Advanced: "bg-rose-50 text-rose-600 ring-rose-100",
  Layout: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};

const GROUPS = [...new Set(FIELD_CATALOG.map((f) => f.group))];
const metaOf = (type: FieldType) => FIELD_CATALOG.find((f) => f.type === type)!;
const chipOf = (type: FieldType) => GROUP_COLORS[metaOf(type).group] ?? "bg-slate-50 text-slate-600 ring-slate-100";

const secondaryButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50";
const primaryButton =
  "inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50";

type Drag = { kind: "new"; type: FieldType } | { kind: "move"; id: string };

function DropLine() {
  return <div aria-hidden className="col-span-full -my-2 h-1 rounded-full bg-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.15)]" />;
}

function FieldPalette({ onPick, onDragStart, onDragEnd }: { onPick: (type: FieldType) => void; onDragStart?: (type: FieldType) => void; onDragEnd?: () => void }) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-1.5 px-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{group}</p>
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
            {FIELD_CATALOG.filter((f) => f.group === group).map((f) => (
              <button
                key={f.type}
                type="button"
                draggable={Boolean(onDragStart)}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "copy";
                  e.dataTransfer.setData("text/plain", f.type);
                  onDragStart?.(f.type);
                }}
                onDragEnd={onDragEnd}
                onClick={() => onPick(f.type)}
                className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:cursor-grab lg:active:cursor-grabbing"
              >
                <TypeChip type={f.type} size="sm" />
                <span className="min-w-0 flex-1 truncate">{f.label}</span>
                <Plus className="size-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeChip({ type, size = "md" }: { type: FieldType; size?: "sm" | "md" }) {
  const Icon = FIELD_ICONS[type];
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg ring-1 ring-inset ${chipOf(type)} ${size === "sm" ? "size-7" : "size-9"}`}>
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
    </span>
  );
}

/* ------------------------------------------------------------------ Modal */

function Modal({ title, icon, onClose, children, footer }: { title: string; icon: ReactNode; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/30 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-lenis-prevent
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          {icon}
          <h2 className="min-w-0 flex-1 truncate font-semibold text-slate-900">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        <footer className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
          {footer}
        </footer>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Canvas preview */

function initialValue(field: FormField) {
  if (field.type === "checkboxes") return [];
  if (field.type === "consent") return "false";
  return field.defaultValue;
}

/** Renders a field exactly like the live form, but inert. */
function FieldPreview({ field, hideLabels }: { field: FormField; hideLabels?: boolean }) {
  if (field.type === "heading") return <h2 className="text-lg font-semibold text-slate-900">{field.label}</h2>;
  if (field.type === "paragraph") return <p className="whitespace-pre-wrap text-sm text-slate-600">{field.label}</p>;
  if (field.type === "divider") return <hr className="my-2 border-slate-200" />;
  if (field.type === "hidden") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed border-rose-200 bg-rose-50/40 px-3 py-2.5 text-sm text-slate-600">
        <EyeOff className="size-4 text-rose-500" aria-hidden />
        <span className="font-medium text-slate-800">{field.label}</span>
        <span className="truncate text-slate-500">Hidden from visitors{field.defaultValue ? ` · ${field.defaultValue}` : ""}</span>
      </p>
    );
  }
  const display = labelDisplay(field, hideLabels);
  return (
    <div>
      {field.type !== "consent" && !display.hidden ? (
        <p className="block text-sm font-medium text-slate-800">
          {field.label}
          {field.required ? <span className="text-red-600"> *</span> : null}
        </p>
      ) : null}
      <FieldControl field={display.field} value={initialValue(field)} files={[]} onChange={() => {}} onFiles={() => {}} onBlur={() => {}} />
      {field.helpText ? <p className="mt-1 text-xs text-slate-500">{field.helpText}</p> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Builder */

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<FormSettingsTab | null>(null);
  const [view, setView] = useState<"build" | "preview">("build");
  const [dirty, setDirty] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<ActionState>({});
  const [pending, start] = useTransition();
  const editing = schema.fields.find((f) => f.id === editingId) ?? null;
  const readOnly = !props.canManage;
  const accent = schema.settings.accentColor || DEFAULT_ACCENT;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!flashId) return;
    document.getElementById(`block-${flashId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const t = setTimeout(() => setFlashId(null), 1200);
    return () => clearTimeout(t);
  }, [flashId]);

  function change(next: FormSchema) {
    setSchema(next);
    setDirty(true);
    setNotice({});
  }

  const setFields = (fields: FormField[]) => change({ ...schema, fields });

  function insertField(type: FieldType, at = schema.fields.length) {
    const field = createField(type);
    const fields = [...schema.fields];
    fields.splice(Math.max(0, Math.min(at, fields.length)), 0, field);
    setFields(fields);
    setFlashId(field.id);
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
    if (editingId === id) setEditingId(null);
  }

  function duplicateField(field: FormField) {
    const copy: FormField = { ...structuredClone(field), id: createField(field.type).id, label: `${field.label} copy`.slice(0, 500) };
    const fields = [...schema.fields];
    fields.splice(fields.findIndex((f) => f.id === field.id) + 1, 0, copy);
    setFields(fields);
    setFlashId(copy.id);
    return copy;
  }

  /** Moves a field so it lands at `slot` (a gap index between 0 and fields.length). */
  function moveToSlot(id: string, slot: number) {
    const from = schema.fields.findIndex((f) => f.id === id);
    if (from < 0) return;
    const target = slot > from ? slot - 1 : slot;
    if (target === from) return;
    const fields = [...schema.fields];
    const [item] = fields.splice(from, 1);
    fields.splice(target, 0, item);
    setFields(fields);
  }

  /* drag & drop */
  function endDrag() {
    setDrag(null);
    setDropIndex(null);
  }

  function overBlock(e: DragEvent<HTMLElement>, index: number) {
    if (!drag) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropIndex(e.clientY < rect.top + rect.height / 2 ? index : index + 1);
  }

  function drop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    const slot = dropIndex ?? schema.fields.length;
    if (drag?.kind === "new") insertField(drag.type, slot);
    if (drag?.kind === "move") moveToSlot(drag.id, slot);
    endDrag();
  }

  /* save / publish */
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
  const statusText = dirty ? "Unsaved changes" : props.hasUnpublishedChanges ? "Saved · not live yet" : "All changes saved";
  const statusDot = dirty ? "bg-amber-400" : props.hasUnpublishedChanges ? "bg-sky-400" : "bg-emerald-400";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
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
            className="w-full min-w-40 max-w-xs rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold outline-none transition hover:border-slate-200 focus:border-teal-600"
          />
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 sm:inline-flex" role="status">
            <span className={`size-1.5 rounded-full ${statusDot}`} aria-hidden />
            {statusText}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSettingsTab("content")} className={secondaryButton}>
            <SlidersHorizontal className="size-4" aria-hidden /> Settings
          </button>
          <button type="button" onClick={() => setView(view === "build" ? "preview" : "build")} aria-pressed={view === "preview"} className={secondaryButton}>
            {view === "build" ? <Eye className="size-4" aria-hidden /> : <PencilRuler className="size-4" aria-hidden />}
            {view === "build" ? "Preview" : "Edit"}
          </button>
          {props.canManage ? (
            <button type="button" onClick={runSave} disabled={pending || !dirty} className={secondaryButton}>
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save
            </button>
          ) : null}
          {props.canPublish && isPublished ? (
            <button type="button" onClick={runUnpublish} disabled={pending} className={secondaryButton}>
              <Undo2 className="size-4" aria-hidden /> Unpublish
            </button>
          ) : null}
          {props.canPublish ? (
            <button type="button" onClick={runPublish} disabled={pending || !canRepublish || (dirty && !props.canManage)} className={primaryButton}>
              <Globe className="size-4" aria-hidden /> {isPublished ? "Update live form" : "Publish"}
            </button>
          ) : null}
        </div>
      </div>

      <Notice state={notice} />

      {view === "preview" ? (
        <div className="rounded-3xl bg-gradient-to-br from-teal-50 via-white to-violet-50 px-3 py-8 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="h-1.5" style={{ background: accent }} />
            <div className="p-5 sm:p-8">
              <p className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Preview: validation and logic work, but nothing is submitted.</p>
              <PublicForm key={JSON.stringify(schema)} slug={slug} schema={schema} mode="preview" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* Palette */}
          {!readOnly ? (
            <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:block lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <div className="mb-3 px-1">
                <p className="text-sm font-semibold text-slate-900">Add fields</p>
                <p className="text-xs text-slate-500">Drag onto the form, or click to add.</p>
              </div>
              <FieldPalette
                onPick={(type) => insertField(type)}
                onDragStart={(type) => setDrag({ kind: "new", type })}
                onDragEnd={endDrag}
              />
            </aside>
          ) : null}

          {/* Canvas */}
          <section
            aria-label="Form preview"
            onDragOver={(e) => {
              if (!drag) return;
              e.preventDefault();
              if (dropIndex === null) setDropIndex(schema.fields.length);
            }}
            onDrop={drop}
            className={`rounded-3xl bg-slate-100/70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] px-3 py-6 [background-size:18px_18px] sm:px-8 sm:py-10 ${readOnly ? "lg:col-span-2" : ""}`}
          >
            <div style={{ "--form-accent": accent } as CSSProperties} className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="h-1.5" style={{ background: accent }} />
              <div className="p-5 sm:p-8">
                {/* Title & description */}
                <button
                  type="button"
                  onClick={() => setSettingsTab("content")}
                  className="-m-2 mb-4 block w-[calc(100%+1rem)] rounded-xl p-2 text-left transition hover:bg-slate-50 hover:ring-1 hover:ring-slate-200"
                >
                  {schema.settings.title ? (
                    <span className="block text-2xl font-semibold tracking-tight text-slate-900">{schema.settings.title}</span>
                  ) : (
                    <span className="block text-2xl font-semibold tracking-tight text-slate-300">Form title</span>
                  )}
                  {schema.settings.description ? (
                    <span className="mt-1.5 block whitespace-pre-wrap text-sm text-slate-600">{schema.settings.description}</span>
                  ) : (
                    <span className="mt-1.5 block text-sm text-slate-400">Add a short description (optional)</span>
                  )}
                </button>

                {schema.fields.length === 0 ? (
                  <div
                    className={`grid min-h-64 place-items-center rounded-2xl border-2 border-dashed px-6 text-center transition ${drag ? "border-teal-400 bg-teal-50/60" : "border-slate-200"}`}
                  >
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-violet-100 text-teal-700">
                        <MousePointerClick className="size-6" aria-hidden />
                      </span>
                      <p className="mt-3 font-semibold text-slate-800">
                        <span className="hidden lg:inline">Drag your first field here</span>
                        <span className="lg:hidden">Add your first field</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        <span className="hidden lg:inline">Or click any field on the left. Click a field to edit it.</span>
                        <span className="lg:hidden">Tap &ldquo;Add field&rdquo; below to start.</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <ol className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    {schema.fields.map((field, index) => {
                      const meta = metaOf(field.type);
                      const open = field.id === editingId;
                      const half = field.width === "half" && !["heading", "paragraph", "divider", "hidden"].includes(field.type);
                      return (
                        <li key={field.id} className={`contents`}>
                          {dropIndex === index && drag ? <DropLine /> : null}
                          <div
                            id={`block-${field.id}`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Edit ${meta.label}: ${field.label}`}
                            draggable={!readOnly}
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", field.id);
                              setDrag({ kind: "move", id: field.id });
                            }}
                            onDragEnd={endDrag}
                            onDragOver={(e) => overBlock(e, index)}
                            onDrop={drop}
                            onClick={() => setEditingId(field.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setEditingId(field.id);
                              }
                            }}
                            className={`group relative min-w-0 cursor-pointer rounded-xl p-3 outline-none transition ${half ? "" : "sm:col-span-2"} ${
                              open
                                ? "bg-teal-50/50 ring-2 ring-teal-500"
                                : flashId === field.id
                                  ? "bg-teal-50 ring-2 ring-teal-300"
                                  : "ring-1 ring-transparent hover:bg-slate-50/80 hover:ring-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500"
                            } ${drag?.kind === "move" && drag.id === field.id ? "opacity-40" : ""}`}
                          >
                            {/* type badge + quick actions */}
                            <div className="pointer-events-none absolute -top-3 left-3 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${chipOf(field.type)}`}>{meta.label}</span>
                              {field.logic?.rules.length ? (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100 ring-inset">
                                  <GitBranch className="size-3" aria-hidden /> Logic
                                </span>
                              ) : null}
                            </div>
                            {!readOnly ? (
                              <div className="absolute -top-3.5 right-2 z-10 flex items-center rounded-lg bg-white p-0.5 opacity-100 shadow-sm ring-1 ring-slate-200 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <span className="hidden cursor-grab p-1 text-slate-400 sm:block" aria-hidden>
                                  <GripVertical className="size-3.5" />
                                </span>
                                <button type="button" aria-label="Move up" disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveToSlot(field.id, index - 1); }} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                                  <ArrowUp className="size-3.5" aria-hidden />
                                </button>
                                <button type="button" aria-label="Move down" disabled={index === schema.fields.length - 1} onClick={(e) => { e.stopPropagation(); moveToSlot(field.id, index + 2); }} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                                  <ArrowDown className="size-3.5" aria-hidden />
                                </button>
                                <button type="button" aria-label="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateField(field); }} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                                  <Copy className="size-3.5" aria-hidden />
                                </button>
                                <button type="button" aria-label="Delete" onClick={(e) => { e.stopPropagation(); removeField(field.id); }} className="rounded-md p-1 text-red-500 hover:bg-red-50">
                                  <Trash2 className="size-3.5" aria-hidden />
                                </button>
                              </div>
                            ) : null}
                            <div inert className="pointer-events-none select-none">
                              <FieldPreview field={field} hideLabels={schema.settings.hideLabels} />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {dropIndex === schema.fields.length && drag ? <DropLine /> : null}
                  </ol>
                )}

                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 py-3 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-50 lg:hidden"
                  >
                    <Plus className="size-4" aria-hidden /> Add field
                  </button>
                ) : null}

                {/* Submit button preview */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setSettingsTab("submit")}
                    title="Edit what happens after submit"
                    className="rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
                    style={{ background: accent }}
                  >
                    {schema.settings.submitLabel || "Submit"}
                  </button>
                </div>
              </div>
            </div>
            {schema.fields.length > 0 && !readOnly ? (
              <p className="mt-4 text-center text-xs text-slate-500">
                <span className="lg:hidden">Tap a field to edit it</span>
                <span className="hidden lg:inline">Click a field to edit it · drag to reorder</span>
              </p>
            ) : null}
          </section>
        </div>
      )}

      {/* Field picker (phones and tablets) */}
      {picking ? (
        <Modal
          title="Add a field"
          icon={
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100 ring-inset">
              <Plus className="size-4" aria-hidden />
            </span>
          }
          onClose={() => setPicking(false)}
          footer={
            <button type="button" onClick={() => setPicking(false)} className={`${secondaryButton} ml-auto`}>
              Cancel
            </button>
          }
        >
          <FieldPalette
            onPick={(type) => {
              insertField(type);
              setPicking(false);
            }}
          />
        </Modal>
      ) : null}

      {/* Field popup */}
      {editing ? (
        <Modal
          title={editing.type === "divider" ? "Divider" : editing.label || metaOf(editing.type).label}
          icon={<TypeChip type={editing.type} />}
          onClose={() => setEditingId(null)}
          footer={
            <>
              {!readOnly ? (
                <>
                  <button type="button" onClick={() => removeField(editing.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                    <Trash2 className="size-4" aria-hidden /> Delete
                  </button>
                  <button type="button" onClick={() => setEditingId(duplicateField(editing).id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                    <Copy className="size-4" aria-hidden /> Duplicate
                  </button>
                </>
              ) : null}
              <button type="button" onClick={() => setEditingId(null)} className={`${primaryButton} ml-auto`}>
                Done
              </button>
            </>
          }
        >
          <p className="-mt-1 mb-4 text-xs text-slate-500">{metaOf(editing.type).label} · changes show on the form straight away</p>
          <fieldset disabled={readOnly} className="min-w-0">
            <FieldSettings key={editing.id} field={editing} fields={schema.fields} onChange={(next) => updateField(editing.id, next)} />
          </fieldset>
        </Modal>
      ) : null}

      {/* Form settings popup */}
      {settingsTab ? (
        <Modal
          title="Form settings"
          icon={
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100 ring-inset">
              <SlidersHorizontal className="size-4" aria-hidden />
            </span>
          }
          onClose={() => setSettingsTab(null)}
          footer={
            <button type="button" onClick={() => setSettingsTab(null)} className={`${primaryButton} ml-auto`}>
              Done
            </button>
          }
        >
          <div role="tablist" aria-label="Form settings" className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                ["content", "Content"],
                ["submit", "After submit"],
                ["link", "Link & webpage"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={settingsTab === id}
                onClick={() => setSettingsTab(id)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${settingsTab === id ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <fieldset disabled={readOnly} className="min-w-0">
            <FormSettingsPanel
              tab={settingsTab}
              schema={schema}
              slug={slug}
              templates={props.templates}
              onSlug={(value) => {
                setSlug(value);
                setDirty(true);
              }}
              onChange={change}
            />
          </fieldset>
        </Modal>
      ) : null}
    </div>
  );
}
