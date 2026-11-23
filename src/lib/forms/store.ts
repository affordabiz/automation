import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { deleteUnusedAssets } from "@/lib/sanity/assets";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/service";
import { parseFormSchema } from "./definition";
import type { FormSchema, StoredFile, SubmissionAnswer } from "./types";

export type FormStatus = "draft" | "published" | "archived";

export interface FormRecord {
  id: string;
  key: string;
  name: string;
  slug: string;
  description: string;
  status: FormStatus;
  draft_schema: FormSchema;
  published_schema: FormSchema | null;
  published_at: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormListItem {
  id: string;
  name: string;
  slug: string;
  status: FormStatus;
  is_system: boolean;
  updated_at: string;
  submissions: number;
}

export interface SubmissionRecord {
  id: string;
  form_id: string;
  answers: SubmissionAnswer[];
  entry_id: string | null;
  source: "link" | "embed";
  created_at: string;
}

const FORM_COLUMNS =
  "id,key,name,slug,description,status,draft_schema,published_schema,published_at,is_system,created_at,updated_at";

export async function listForms(): Promise<FormListItem[]> {
  const { data, error } = await serviceClient()
    .from("forms")
    .select("id,name,slug,status,is_system,updated_at,form_submissions(count)")
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<(Omit<FormListItem, "submissions"> & { form_submissions: { count: number }[] })[]>();
  if (error) throw new Error(`Could not load forms: ${error.message}`);
  return data.map(({ form_submissions, ...form }) => ({ ...form, submissions: form_submissions[0]?.count ?? 0 }));
}

export async function getForm(id: string): Promise<FormRecord | null> {
  const { data, error } = await serviceClient().from("forms").select(FORM_COLUMNS).eq("id", id).maybeSingle<FormRecord>();
  if (error) throw new Error(`Could not load form: ${error.message}`);
  return data;
}

export async function isFormSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = serviceClient().from("forms").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { count, error } = await query;
  if (error) throw new Error(`Could not check form link: ${error.message}`);
  return (count ?? 0) > 0;
}

export interface PublicForm {
  id: string;
  name: string;
  slug: string;
  schema: FormSchema;
}

async function fetchPublicForm(slug: string): Promise<PublicForm | null> {
  const { data, error } = await serviceClient()
    .from("forms")
    .select("id,name,slug,published_schema")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_system", false)
    .maybeSingle<{ id: string; name: string; slug: string; published_schema: unknown }>();
  if (error) throw new Error(`Could not load form: ${error.message}`);
  if (!data?.published_schema) return null;
  const parsed = parseFormSchema(data.published_schema);
  return parsed.ok ? { id: data.id, name: data.name, slug: data.slug, schema: parsed.schema } : null;
}

/** Cached for visitors. Publishing or unpublishing expires the `form:{slug}` tag. */
export async function getCachedPublicForm(slug: string): Promise<PublicForm | null> {
  "use cache";
  cacheTag(`form:${slug}`);
  cacheLife("max");
  if (!isSupabaseConfigured()) return null;
  return fetchPublicForm(slug);
}

/** Submissions always validate against the current published version. */
export const getLatestPublicForm = fetchPublicForm;

export async function listSubmissions(formId: string, limit = 500): Promise<SubmissionRecord[]> {
  const { data, error } = await serviceClient()
    .from("form_submissions")
    .select("id,form_id,answers,entry_id,source,created_at")
    .eq("form_id", formId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<SubmissionRecord[]>();
  if (error) throw new Error(`Could not load submissions: ${error.message}`);
  return data;
}

export function submissionFilePaths(rows: readonly Pick<SubmissionRecord, "answers">[]): string[] {
  return rows.flatMap((row) => row.answers.flatMap((a) => (a.files ?? []).map((f: StoredFile) => f.path)));
}

export const removeFormFiles = deleteUnusedAssets;
