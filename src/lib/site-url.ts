/**
 * The site's public origin, without a trailing slash.
 *
 * `NEXT_PUBLIC_SERVER_URL` wins when it is actually set — a *blank* value counts as unset,
 * because Vercel happily defines variables as empty strings and `new URL('')` then throws at
 * build time. Otherwise Vercel's own system variables supply it: the production domain on
 * production deploys, the deployment URL on previews. Locally it falls back to the dev port.
 *
 * Dependency-free on purpose: next.config.ts imports it before anything else is loaded.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const host =
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL
  if (host) return `https://${host}`
  return 'http://localhost:3100'
}
