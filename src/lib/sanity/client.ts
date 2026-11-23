import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Read-only, published content. Caching is handled by "use cache" + cacheTag, so no CDN. */
export const readClient = createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published" });
