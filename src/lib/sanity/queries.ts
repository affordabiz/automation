import { cacheLife, cacheTag } from "next/cache";
import { defineQuery } from "next-sanity";
import { readClient } from "./client";
import { mergeCopy } from "@/lib/mergeCopy";
import { getDefaultCopy } from "@/templates/defaults";
import type { TemplateCopy } from "@/templates/types";

const TEMPLATE_COPY_QUERY = defineQuery(`*[_type == "template" && number == $n][0].copy`);

export async function getTemplateCopy(n: number): Promise<TemplateCopy | null> {
  "use cache";
  cacheTag("templates");
  cacheLife("max");
  const defaults = getDefaultCopy(n);
  if (!defaults) return null;
  const cms = await readClient.fetch<unknown>(TEMPLATE_COPY_QUERY, { n });
  return mergeCopy(defaults, cms);
}
