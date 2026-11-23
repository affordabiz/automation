"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { parseFormSchema, publishProblems } from "@/lib/forms/definition";
import {
  getForm,
  isFormSlugTaken,
  listSubmissions,
  removeFormFiles,
  submissionFilePaths,
  type FormRecord,
} from "@/lib/forms/store";
import type { FormSchema } from "@/lib/forms/types";
import { assetUrl } from "@/lib/sanity/assetUrl";
import { isValidSlugFormat, slugify, SLUG_FORMAT_MESSAGE } from "@/lib/slug";
import { serviceClient } from "@/lib/supabase/service";

const EMPTY_SCHEMA: FormSchema = { fields: [], settings: {} };
const nameSchema = z.string().trim().min(2, "Use at least 2 characters.").max(100, "Name is too long.");

function refresh() {
  revalidatePath("/admin", "layout");
}

async function loadEditable(id: string): Promise<FormRecord | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const form = await getForm(id);
  return form && !form.is_system ? form : null;
}

async function uniqueSlug(base: string): Promise<string> {
  const root = (slugify(base) || "form").slice(0, 40).replace(/-+$/, "").padEnd(3, "0");
  if (!(await isFormSlugTaken(root))) return root;
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

async function insertForm(name: string, schema: FormSchema, createdBy: string): Promise<string> {
  const slug = await uniqueSlug(name);
  const { data, error } = await serviceClient()
    .from("forms")
    .insert({ key: `form-${crypto.randomUUID()}`, name, slug, status: "draft", draft_schema: schema, created_by: createdBy })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function createFormAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("forms.manage");
  const name = nameSchema.safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0]?.message ?? "Enter a name." };

  let id: string;
  try {
    id = await insertForm(name.data, { ...EMPTY_SCHEMA, settings: { title: name.data } }, actor.id);
  } catch (e) {
    console.error("[forms] create failed", e);
    return { error: "Couldn't create the form." };
  }
  await recordAudit({ actor, action: "forms.created", targetType: "form", targetId: id, details: { name: name.data } });
  refresh();
  redirect(`/admin/forms/${id}`);
}

export async function saveFormAction(id: string, input: { name: string; slug: string; schema: unknown }): Promise<ActionState> {
  const actor = await requirePermission("forms.manage");
  const form = await loadEditable(id);
  if (!form) return { error: "Form not found." };

  const name = nameSchema.safeParse(input.name);
  if (!name.success) return { error: `Form name: ${name.error.issues[0]?.message}` };
  const slug = String(input.slug ?? "").trim().toLowerCase();
  if (!isValidSlugFormat(slug)) return { error: `Form link: ${SLUG_FORMAT_MESSAGE}` };
  const parsed = parseFormSchema(input.schema);
  if (!parsed.ok) return { error: parsed.error };
  if (slug !== form.slug && (await isFormSlugTaken(slug, form.id))) return { error: "That form link is already in use." };

  const { error } = await serviceClient()
    .from("forms")
    .update({ name: name.data, slug, draft_schema: parsed.schema })
    .eq("id", form.id);
  if (error) {
    if (error.code === "23505") return { error: "That form link is already in use." };
    console.error("[forms] save failed", form.id, error.message);
    return { error: "Couldn't save this form." };
  }
  if (slug !== form.slug) {
    revalidateTag(`form:${form.slug}`, { expire: 0 });
    revalidateTag(`form:${slug}`, { expire: 0 });
  }
  await recordAudit({ actor, action: "forms.saved", targetType: "form", targetId: form.id, details: { name: name.data, slug } });
  refresh();
  return { message: "Saved." };
}

export async function publishFormAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("forms.publish");
  const form = await loadEditable(id);
  if (!form) return { error: "Form not found." };

  const parsed = parseFormSchema(form.draft_schema);
  if (!parsed.ok) return { error: parsed.error };
  const problems = publishProblems(parsed.schema);
  if (problems.length > 0) return { error: problems.slice(0, 3).join(" ") };

  const { error } = await serviceClient()
    .from("forms")
    .update({ status: "published", published_schema: parsed.schema, published_at: new Date().toISOString() })
    .eq("id", form.id);
  if (error) {
    console.error("[forms] publish failed", form.id, error.message);
    return { error: "Couldn't publish this form." };
  }
  revalidateTag(`form:${form.slug}`, { expire: 0 });
  await recordAudit({ actor, action: "forms.published", targetType: "form", targetId: form.id, details: { slug: form.slug } });
  refresh();
  return { message: "Published. Your link is live." };
}

export async function unpublishFormAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("forms.publish");
  const form = await loadEditable(id);
  if (!form) return { error: "Form not found." };
  const { error } = await serviceClient().from("forms").update({ status: "draft" }).eq("id", form.id);
  if (error) return { error: "Couldn't unpublish this form." };
  revalidateTag(`form:${form.slug}`, { expire: 0 });
  await recordAudit({ actor, action: "forms.unpublished", targetType: "form", targetId: form.id, details: { slug: form.slug } });
  refresh();
  return { message: "Unpublished. The link no longer accepts responses." };
}

export async function duplicateFormAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("forms.manage");
  const form = await loadEditable(id);
  if (!form) return { error: "Form not found." };
  try {
    const name = `${form.name} copy`.slice(0, 100);
    const copy = await insertForm(name, form.draft_schema, actor.id);
    await recordAudit({ actor, action: "forms.duplicated", targetType: "form", targetId: copy, details: { from: form.id } });
  } catch (e) {
    console.error("[forms] duplicate failed", e);
    return { error: "Couldn't duplicate this form." };
  }
  refresh();
  return { message: "Form duplicated." };
}

export async function deleteFormAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("forms.manage");
  const form = await loadEditable(id);
  if (!form) return { error: "This form can't be deleted." };

  const { count, error: countError } = await serviceClient()
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("form_id", form.id);
  if (countError) return { error: "Couldn't delete this form." };
  if (count) return { error: "This form has webpage entries. Delete those entries first, or unpublish the form." };

  const paths = submissionFilePaths(await listSubmissions(form.id, 10000));
  const { error } = await serviceClient().from("forms").delete().eq("id", form.id);
  if (error) {
    console.error("[forms] delete failed", form.id, error.message);
    return { error: "Couldn't delete this form." };
  }
  await removeFormFiles(paths).catch((e) => console.error("[forms] file cleanup failed", e));
  revalidateTag(`form:${form.slug}`, { expire: 0 });
  await recordAudit({ actor, action: "forms.deleted", targetType: "form", targetId: form.id, details: { name: form.name, slug: form.slug } });
  refresh();
  return { message: "Form deleted." };
}

export async function deleteSubmissionsAction(formId: string, ids: string[]): Promise<ActionState> {
  const actor = await requirePermission("forms.manage");
  const parsedIds = z.array(z.uuid()).min(1).max(200).safeParse(ids);
  if (!z.uuid().safeParse(formId).success || !parsedIds.success) return { error: "Select at least one submission." };

  const service = serviceClient();
  const { data, error } = await service
    .from("form_submissions")
    .select("id,answers")
    .eq("form_id", formId)
    .in("id", parsedIds.data)
    .returns<{ id: string; answers: never[] }[]>();
  if (error) return { error: "Couldn't delete these submissions." };
  const { error: deleteError } = await service.from("form_submissions").delete().eq("form_id", formId).in("id", parsedIds.data);
  if (deleteError) return { error: "Couldn't delete these submissions." };
  await removeFormFiles(submissionFilePaths(data)).catch((e) => console.error("[forms] file cleanup failed", e));
  await recordAudit({ actor, action: "forms.submissions_deleted", targetType: "form", targetId: formId, details: { count: data.length } });
  refresh();
  return { message: `${data.length} ${data.length === 1 ? "submission" : "submissions"} deleted.` };
}

export async function getSubmissionFileUrlAction(formId: string, submissionId: string, path: string): Promise<{ url?: string; error?: string }> {
  await requirePermission("forms.view");
  if (!z.uuid().safeParse(formId).success || !z.uuid().safeParse(submissionId).success) return { error: "File not found." };
  const { data } = await serviceClient()
    .from("form_submissions")
    .select("answers")
    .eq("id", submissionId)
    .eq("form_id", formId)
    .maybeSingle<{ answers: { files?: { path: string; name: string }[] }[] }>();
  const file = data?.answers.flatMap((a) => a.files ?? []).find((f) => f.path === path);
  if (!file) return { error: "File not found." };
  try {
    return { url: `${assetUrl(file.path)}?dl=${encodeURIComponent(file.name)}` };
  } catch {
    return { error: "Couldn't open this file." };
  }
}
