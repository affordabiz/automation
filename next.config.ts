import type { NextConfig } from "next";
import { WORDPRESS_FILE_REDIRECTS, WORDPRESS_REDIRECTS } from "./src/lib/legacyRedirects";

const nextConfig: NextConfig = {
  redirects() {
    return [...WORDPRESS_REDIRECTS, ...WORDPRESS_FILE_REDIRECTS].map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
