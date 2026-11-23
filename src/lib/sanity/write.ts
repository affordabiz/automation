import "server-only";
import { readClient } from "./client";
import type { OnboardingData } from "@/forms/onboarding.schema";

const writeClient = readClient.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  perspective: "raw",
  useCdn: false,
});

export function siteDocId(slug: string): string {
  return `site-${slug}`;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const id = siteDocId(slug);
  const count = await writeClient.fetch<number>(
    `count(*[_type == "site" && (slug.current == $slug || _id in [$id, "drafts." + $id])])`,
    { slug, id },
  );
  return count > 0;
}

async function uploadImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return writeClient.assets.upload("image", buffer, { filename: file.name, contentType: file.type });
}

function isConflict(e: unknown): boolean {
  return typeof e === "object" && e !== null && "statusCode" in e && (e as { statusCode: number }).statusCode === 409;
}

export async function createSite(
  input: OnboardingData,
  logo: File,
  photo: File,
): Promise<"created" | "conflict"> {
  const [logoAsset, photoAsset] = await Promise.all([uploadImage(logo), uploadImage(photo)]);
  try {
    await writeClient.create({
      _id: siteDocId(input.slug),
      _type: "site",
      slug: { _type: "slug", current: input.slug },
      templateNumber: input.templateNumber,
      fullName: input.fullName,
      businessName: input.businessName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      servingArea: input.servingArea,
      logo: { _type: "image", asset: { _type: "reference", _ref: logoAsset._id } },
      photo: { _type: "image", asset: { _type: "reference", _ref: photoAsset._id } },
      published: true,
      createdAt: new Date().toISOString(),
    });
    return "created";
  } catch (e) {
    await Promise.allSettled([writeClient.delete(logoAsset._id), writeClient.delete(photoAsset._id)]);
    if (isConflict(e)) return "conflict";
    throw e;
  }
}

export async function logContactMessage(entry: {
  siteId: string; name: string; email: string; phone: string; message: string; emailStatus: "sent" | "failed";
}): Promise<void> {
  await writeClient.create({
    _type: "contactMessage",
    site: { _type: "reference", _ref: entry.siteId },
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    message: entry.message,
    emailStatus: entry.emailStatus,
    sentAt: new Date().toISOString(),
  });
}
