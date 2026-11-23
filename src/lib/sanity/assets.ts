import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import { isSanityAssetId } from "./assetUrl";
import { readClient } from "./client";

const writeClient = readClient.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  perspective: "raw",
  useCdn: false,
});

export async function uploadImageAsset(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await writeClient.assets.upload("image", buffer, { filename: file.name, contentType: file.type });
  return asset._id;
}

export async function uploadFileAsset(file: File, contentType: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await writeClient.assets.upload("file", buffer, { filename: file.name, contentType });
  return asset._id;
}

/** Sanity stores identical files once, so another entry or response may share the same asset. */
async function isAssetInUse(id: string): Promise<boolean> {
  const service = serviceClient();
  const [entries, submissions] = await Promise.all([
    service.from("entries").select("id", { count: "exact", head: true }).or(`logo_path.eq.${id},photo_path.eq.${id}`),
    service
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .contains("answers", JSON.stringify([{ files: [{ path: id }] }])),
  ]);
  if (entries.error || submissions.error) return true;
  return (entries.count ?? 0) + (submissions.count ?? 0) > 0;
}

/** Call after the database row is updated or deleted. Failures leave the file in place. */
export async function deleteUnusedAssets(ids: readonly (string | null)[]): Promise<void> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id) && isSanityAssetId(id as string)))];
  await Promise.allSettled(
    unique.map(async (id) => {
      if (!(await isAssetInUse(id))) await writeClient.delete(id);
    }),
  );
}
