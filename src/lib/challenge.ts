import { createHmac, timingSafeEqual } from 'node:crypto'

import { env } from './env'

/**
 * A self-contained human challenge — a small sum, signed so the answer cannot be forged
 * and the server holds no session state. No third-party captcha, no external request,
 * nothing to key or bill.
 */
export type Challenge = { question: string; token: string }

const WINDOW_MS = 20 * 60 * 1000

const sign = (answer: number, issued: number) =>
  createHmac('sha256', env.PAYLOAD_SECRET).update(`${answer}.${issued}`).digest('hex')

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function makeChallenge(): Challenge {
  const a = 2 + Math.floor(Math.random() * 7)
  const b = 1 + Math.floor(Math.random() * 5)
  const add = Math.random() < 0.5
  const answer = add ? a + b : a - b
  const issued = Date.now()
  return {
    // Words rather than digits, so a naive form-filler cannot regex the numbers out.
    question: `What is ${WORDS[a]} ${add ? 'plus' : 'minus'} ${WORDS[b]}?`,
    token: `${issued}.${sign(answer, issued)}`,
  }
}

export function verifyChallenge(token: unknown, answer: unknown): boolean {
  if (typeof token !== 'string' || typeof answer !== 'string') return false

  const [issuedRaw, mac] = token.split('.')
  const issued = Number(issuedRaw)
  if (!issued || !mac) return false
  if (Date.now() - issued > WINDOW_MS) return false

  // Accept digits or the written word, since the question is posed in words.
  const trimmed = answer.trim().toLowerCase()
  const value = /^-?\d+$/.test(trimmed) ? Number(trimmed) : WORDS.indexOf(trimmed)
  if (!Number.isInteger(value) || value < 0) return false

  const expected = Buffer.from(sign(value, issued), 'hex')
  const given = Buffer.from(mac, 'hex')
  return expected.length === given.length && timingSafeEqual(expected, given)
}
