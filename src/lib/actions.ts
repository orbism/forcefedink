'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { getPayloadClient } from './payload'
import { makeChallenge, verifyChallenge } from './challenge'
import { env, hasResend } from './env'

const enquirySchema = z.object({
  type: z.enum(['print', 'original', 'commission', 'general']),
  name: z.string().trim().min(1, 'Tell me your name').max(120),
  email: z.email('That email does not look right'),
  message: z.string().trim().min(10, 'A little more detail, please').max(4000),
  subject: z.string().trim().max(200).optional(),
  subjectUrl: z.string().trim().max(500).optional(),
  // Honeypot: real people never fill this in.
  company: z.string().max(0).optional(),
  // Human challenge, present on the popup form.
  challengeToken: z.string().optional(),
  challengeAnswer: z.string().optional(),
})

const subscribeSchema = z.object({
  email: z.email('That email does not look right'),
  source: z.string().trim().max(200).optional(),
  company: z.string().max(0).optional(),
})

/**
 * React 19 resets an uncontrolled form once its action resolves. On a rejected submit
 * that wipes everything the user typed — and the next attempt then fails HTML5 required
 * validation and never reaches the server at all. Echoing the values back lets the form
 * restore them as defaults, so a wrong challenge answer costs one field, not the message.
 */
export type FormValues = { type?: string; name?: string; email?: string; message?: string }

export type FormState = {
  ok: boolean
  error?: string
  message?: string
  values?: FormValues
}

/** Crude per-process rate limit — enough to blunt casual form spam. */
const hits = new Map<string, number[]>()
const LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000

async function rateLimited() {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > LIMIT
}

const fields = (data: FormData) => Object.fromEntries(data.entries())

const echo = (data: FormData): FormValues => ({
  type: String(data.get('type') ?? ''),
  name: String(data.get('name') ?? ''),
  email: String(data.get('email') ?? ''),
  message: String(data.get('message') ?? ''),
})

export async function submitEnquiry(_prev: FormState, data: FormData): Promise<FormState> {
  const parsed = enquirySchema.safeParse(fields(data))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Please check the form.',
      values: echo(data),
    }
  }
  // Silently accept honeypot hits so bots get no signal.
  if (parsed.data.company) return { ok: true, message: 'Thanks — I will be in touch.' }
  if (await rateLimited()) {
    return { ok: false, error: 'Too many messages. Try again later.', values: echo(data) }
  }

  // Only enforced when the form issued a challenge, so the plain contact page still works.
  if (parsed.data.challengeToken && !verifyChallenge(parsed.data.challengeToken, parsed.data.challengeAnswer)) {
    return { ok: false, error: 'That answer was not right. Have another go.', values: echo(data) }
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'enquiries',
    // The collection denies public create; this write is trusted server-side.
    overrideAccess: true,
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      subjectTitle: parsed.data.subject,
      subjectUrl: parsed.data.subjectUrl,
    },
  })

  if (hasResend) {
    await payload.sendEmail({
      to: env.EMAIL_TO,
      subject: `Enquiry (${parsed.data.type})${parsed.data.subject ? ` — ${parsed.data.subject}` : ''}`,
      text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
    })
  }

  return { ok: true, message: 'Thanks — I will be in touch.' }
}

export async function subscribe(_prev: FormState, data: FormData): Promise<FormState> {
  const parsed = subscribeSchema.safeParse(fields(data))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Please check the form.',
      values: { email: String(data.get('email') ?? '') },
    }
  }
  if (parsed.data.company) return { ok: true, message: 'You are on the list.' }
  if (await rateLimited()) {
    return { ok: false, error: 'Too many attempts. Try again later.', values: { email: String(data.get('email') ?? '') } }
  }

  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: parsed.data.email } },
    limit: 1,
    overrideAccess: true,
  })
  // Re-subscribing is not an error worth surfacing.
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'subscribers',
      overrideAccess: true,
      data: { email: parsed.data.email, source: parsed.data.source },
    })
  }

  return { ok: true, message: 'You are on the list.' }
}

/** Issued fresh each time the popup opens, so a token cannot be reused indefinitely. */
export async function newChallenge() {
  return makeChallenge()
}
