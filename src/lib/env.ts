import { z } from 'zod'

import { siteUrl } from './site-url'

/**
 * Fail loudly at boot rather than mysteriously at request time.
 * Optional keys degrade to a local-friendly default (disk storage, console email).
 */
const schema = z.object({
  DATABASE_URI: z.string().min(1, 'DATABASE_URI is required'),
  PAYLOAD_SECRET: z.string().min(16, 'PAYLOAD_SECRET must be at least 16 characters'),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('studio@forcefedink.com'),
  EMAIL_TO: z.string().default('studio@forcefedink.com'),
})

const blank = (v: string | undefined) => (v && v.length ? v : undefined)

const parsed = schema.safeParse({
  DATABASE_URI: process.env.DATABASE_URI,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  NEXT_PUBLIC_SERVER_URL: siteUrl(),
  BLOB_READ_WRITE_TOKEN: blank(process.env.BLOB_READ_WRITE_TOKEN),
  RESEND_API_KEY: blank(process.env.RESEND_API_KEY),
  EMAIL_FROM: blank(process.env.EMAIL_FROM),
  EMAIL_TO: blank(process.env.EMAIL_TO),
})

if (!parsed.success) {
  throw new Error(
    `Invalid environment:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
  )
}

export const env = parsed.data
export const hasBlob = Boolean(env.BLOB_READ_WRITE_TOKEN)
export const hasResend = Boolean(env.RESEND_API_KEY)
