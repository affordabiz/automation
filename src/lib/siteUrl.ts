const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i;

/**
 * Public origin used in emails and links (no trailing slash).
 * Uses NEXT_PUBLIC_SITE_URL, but never a localhost value on a Vercel deploy:
 * there it falls back to the deployment's own domain.
 */
export function siteBase(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (configured && !(process.env.VERCEL && LOCAL.test(configured))) return configured;
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return configured || "http://localhost:3000";
}

export function siteUrl(slug: string): string {
  return `${siteBase()}/${slug}`;
}
