import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { getForm } from "@/lib/forms/store";

/** Shared by the layout and page so one navigation loads the form once. */
export const loadForm = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) notFound();
  const form = await getForm(id);
  if (!form || form.is_system) notFound();
  return form;
});
