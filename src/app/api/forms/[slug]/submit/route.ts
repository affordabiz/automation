import { NextResponse } from "next/server";
import { ONBOARDING_FIELDS, type FieldDef } from "@/forms/onboarding.fields";
import { checkImage, type OnboardingData } from "@/forms/onboarding.schema";
import { createPendingEntry, type Entry } from "@/lib/entries/store";
import { finishNewEntry } from "@/lib/entries/workflow";
import { allowedExtensions, displayValue, fileExtension, isEmptyValue, isInputField, validateForm } from "@/lib/forms/engine";
import { getLatestPublicForm, removeFormFiles } from "@/lib/forms/store";
import type { FormField, FormValues, StoredFile, SubmissionAnswer, WebpageLink, WebpageSlot } from "@/lib/forms/types";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { uploadFileAsset } from "@/lib/sanity/assets";
import { TAKEN_MESSAGE } from "@/lib/slug";
import { checkSlug } from "@/lib/slugCheck";
import { serviceClient } from "@/lib/supabase/service";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

function readValues(fields: readonly FormField[], form: FormData) {
  const values: FormValues = {};
  const files: Record<string, File[]> = {};
  for (const field of fields) {
    if (!isInputField(field)) continue;
    if (field.type === "hidden") values[field.id] = field.defaultValue ?? "";
    else if (field.type === "file") {
      files[field.id] = form.getAll(field.id).filter((v): v is File => v instanceof File && v.size > 0);
    } else if (field.type === "checkboxes") {
      values[field.id] = form.getAll(field.id).filter((v): v is string => typeof v === "string");
    } else {
      const value = form.get(field.id);
      values[field.id] = typeof value === "string" ? value : "";
    }
  }
  return { values, files };
}

function webpageInput(link: WebpageLink, values: FormValues, files: Record<string, File[]>) {
  const text = (slot: WebpageSlot) => String(values[link.map[slot] ?? ""] ?? "").trim();
  const data: OnboardingData = {
    fullName: text("fullName"),
    businessName: text("businessName"),
    email: text("email").toLowerCase(),
    phone: text("phone"),
    address: text("address"),
    servingArea: text("servingArea"),
    slug: text("slug").toLowerCase(),
    templateNumber: link.templateNumber,
  };
  return { data, logo: files[link.map.logo ?? ""]?.[0], photo: files[link.map.photo ?? ""]?.[0] };
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const ip = clientIp(req.headers);
  if (!rateLimit(`form:${slug}:${ip}`, 20, 60 * 60 * 1000)) {
    return json({ error: "Too many submissions. Please try again later." }, 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "This submission is too large. Use smaller files." }, 413);
  }
  if (String(form.get("company_website") ?? "") !== "") return json({ error: "Submission rejected." }, 403);
  if (!(await verifyTurnstile(String(form.get("cf-turnstile-response") ?? ""), ip))) {
    return json({ error: "Please complete the security check and try again." }, 403);
  }

  let definition;
  try {
    definition = await getLatestPublicForm(slug);
  } catch (e) {
    console.error("[forms] load failed", slug, e);
    return json({ error: "We couldn't submit this form. Please try again." }, 500);
  }
  if (!definition) return json({ error: "This form is no longer accepting responses." }, 404);

  const { fields, settings } = definition.schema;
  const { values, files } = readValues(fields, form);
  const { errors, visible } = validateForm(fields, values, files);
  if (Object.keys(errors).length > 0) return json({ errors }, 400);

  const link = settings.webpage ?? null;
  const webpage = link ? webpageInput(link, values, files) : null;
  if (link && webpage) {
    const logoField = link.map.logo!;
    const photoField = link.map.photo!;
    const imageDef = (name: string): FieldDef => ONBOARDING_FIELDS.find((f) => f.name === name)!;
    const logoProblem = checkImage(imageDef("logo"), webpage.logo ?? null);
    const photoProblem = checkImage(imageDef("photo"), webpage.photo ?? null);
    if (logoProblem || photoProblem) {
      return json({ errors: { ...(logoProblem ? { [logoField]: logoProblem } : {}), ...(photoProblem ? { [photoField]: photoProblem } : {}) } }, 400);
    }
    try {
      const status = await checkSlug(webpage.data.slug);
      if (!status.available) {
        const suffix = status.reason === "taken" && status.suggestion ? ` Try ${status.suggestion}.` : "";
        return json({ errors: { [link.map.slug!]: `${status.message}${suffix}` } }, 409);
      }
    } catch (e) {
      console.error("[forms] slug check failed", e);
      return json({ error: "We couldn't submit this form. Please try again." }, 500);
    }
  }

  const submissionId = crypto.randomUUID();
  const uploaded: string[] = [];
  const service = serviceClient();
  const rollback = async () => {
    await service.from("form_submissions").delete().eq("id", submissionId);
    if (uploaded.length > 0) await removeFormFiles(uploaded);
  };

  try {
    const answers: SubmissionAnswer[] = [];
    for (const field of fields) {
      if (!isInputField(field) || !visible.has(field.id)) continue;
      if (field.type === "file") {
        const stored: StoredFile[] = [];
        const allowed = allowedExtensions(field.validation?.fileGroups);
        for (const file of files[field.id] ?? []) {
          const extension = fileExtension(file.name);
          const contentType = allowed[extension];
          const path = await uploadFileAsset(file, contentType);
          uploaded.push(path);
          stored.push({ name: file.name.slice(0, 200), path, size: file.size, contentType });
        }
        if (stored.length > 0) {
          answers.push({
            fieldId: field.id,
            label: field.label,
            type: field.type,
            value: stored.map((f) => f.name),
            display: stored.map((f) => f.name).join(", "),
            files: stored,
          });
        }
        continue;
      }
      const value = values[field.id];
      if (isEmptyValue(value)) continue;
      answers.push({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        value: typeof value === "string" ? value.trim() : value,
        display: displayValue(field, value),
      });
    }

    const { error } = await service.from("form_submissions").insert({
      id: submissionId,
      form_id: definition.id,
      answers,
      source: form.get("source") === "embed" ? "embed" : "link",
    });
    if (error) throw new Error(`Could not save submission: ${error.message}`);

    let entry: Entry | null = null;
    if (link && webpage?.logo && webpage.photo) {
      const created = await createPendingEntry(webpage.data, webpage.logo, webpage.photo, definition.id);
      if (created.result === "conflict") {
        await rollback();
        return json({ errors: { [link.map.slug!]: TAKEN_MESSAGE } }, 409);
      }
      entry = created.entry;
      const { error: linkError } = await service.from("form_submissions").update({ entry_id: entry.id }).eq("id", submissionId);
      if (linkError) console.error("[forms] entry link not saved", submissionId, linkError.message);
    }

    const webpageUrl = entry ? await finishNewEntry(entry) : null;
    return json({ ok: true, ...(webpageUrl ? { webpageUrl } : {}) }, 201);
  } catch (e) {
    console.error("[forms] submit failed", slug, e);
    await rollback().catch((cleanup) => console.error("[forms] cleanup failed", cleanup));
    return json({ error: "We couldn't submit this form. Please try again." }, 500);
  }
}
