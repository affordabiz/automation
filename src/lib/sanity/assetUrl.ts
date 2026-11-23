import { dataset, projectId } from "./env";

const IMAGE_ID = /^image-([a-f0-9]+)-(\d+x\d+)-([a-z0-9]+)$/;
const FILE_ID = /^file-([a-f0-9]+)-([a-z0-9]+)$/;

export const isSanityAssetId = (id: string) => IMAGE_ID.test(id) || FILE_ID.test(id);

/** Builds the CDN URL from a Sanity asset ID. */
export function assetUrl(id: string): string {
  const image = id.match(IMAGE_ID);
  if (image) return `https://cdn.sanity.io/images/${projectId}/${dataset}/${image[1]}-${image[2]}.${image[3]}`;
  const file = id.match(FILE_ID);
  if (file) return `https://cdn.sanity.io/files/${projectId}/${dataset}/${file[1]}.${file[2]}`;
  throw new Error("Not a Sanity asset ID.");
}
