import { z } from 'zod'

import { siteUrl } from './site-url'

/**
 * Fail loudly at boot rather than mysteriously at request time.
 * Optional keys degrade to a local-friendly default (disk storage, console email).
 */
const schema = z.object({
  DATABASE_URI: z
    .string({ error: 'missing — set DATABASE_URI, or connect Prisma Postgres (it provides DATABASE_URL)' })
    .refine((v) => /^postgres(ql)?:\/\//.test(v), {
      // The Accelerate URL is an HTTP proxy, not a Postgres endpoint; Drizzle cannot use it.
      message: 'must be a direct postgres:// URL, not prisma+postgres:// (Accelerate)',
    }),
  PAYLOAD_SECRET: z
    .string({ error: 'missing — add a random string of 32+ characters (it signs login sessions)' })
    .min(16, 'must be at least 16 characters'),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('studio@forcefedink.com'),
  EMAIL_TO: z.string().default('studio@forcefedink.com'),
})

const blank = (v: string | undefined) => (v?.trim() ? v.trim() : undefined)

/** First of these variables that is actually set — hosts define some as empty strings. */
const first = (...keys: string[]) => keys.map((k) => blank(process.env[k])).find(Boolean)

const parsed = schema.safeParse({
  // Payload's own name first; then the names Vercel's Prisma Postgres integration injects.
  DATABASE_URI: first('DATABASE_URI', 'DATABASE_URL', 'POSTGRES_URL'),
  PAYLOAD_SECRET: blank(process.env.PAYLOAD_SECRET),
  NEXT_PUBLIC_SERVER_URL: siteUrl(),
  BLOB_READ_WRITE_TOKEN: blank(process.env.BLOB_READ_WRITE_TOKEN),
  RESEND_API_KEY: blank(process.env.RESEND_API_KEY),
  EMAIL_FROM: blank(process.env.EMAIL_FROM),
  EMAIL_TO: blank(process.env.EMAIL_TO),
})

if (!parsed.success) {
  throw new Error(
    `Invalid environment:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}\n` +
      `On Vercel: Project → Settings → Environment Variables, enabled for the environment being built.`,
  )
}

export const env = parsed.data
export const hasBlob = Boolean(env.BLOB_READ_WRITE_TOKEN)
export const hasResend = Boolean(env.RESEND_API_KEY)
