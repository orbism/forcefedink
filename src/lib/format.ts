import type { Media } from '@/payload-types'

import type { Edition, OriginalListing } from './shop'

import { siteUrl } from './site-url'

export const money = (n?: number | null) =>
  typeof n === 'number' ? `$${n.toLocaleString('en-US')}` : null

/** Server-formatted in a fixed locale and zone, so it can never mismatch on hydration. */
export const when = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'UTC',
    weekday: withTime ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' } : {}),
  })

/** What an edition's availability actually says to a buyer. */
export function editionAvailability(e: Edition) {
  if (e.status === 'upcoming') {
    return { label: 'Coming soon', remaining: e.remaining, soldOut: false, available: false } as const
  }
  if (e.status === 'soldout' || e.remaining === 0) {
    return { label: 'Sold out', remaining: 0, soldOut: true, available: false } as const
  }
  if (e.status === 'archived') {
    return { label: 'Archived', remaining: e.remaining, soldOut: true, available: false } as const
  }
  return { label: `${e.remaining} of ${e.run} remaining`, remaining: e.remaining, soldOut: false, available: true } as const
}

export function originalAvailability(original?: OriginalListing | null) {
  if (!original) return null
  if (original.status === 'sold') return { label: 'Sold', price: null, available: false } as const
  if (original.status === 'reserved') return { label: 'Reserved', price: null, available: false } as const
  return { label: money(original.price) ?? 'Contact for price', price: original.price, available: true } as const
}

/** Payload gives relationships as id or doc depending on depth — normalise. */
export const asDoc = <T,>(v: T | number | string | null | undefined): T | null =>
  v && typeof v === 'object' ? (v as T) : null

/**
 * Payload emits absolute URLs built from serverURL. Same-origin ones are made relative so
 * next/image serves them directly — Next 16 refuses to fetch an upstream image that
 * resolves to a private IP (SSRF guard), which is every local dev URL. Vercel Blob URLs
 * are a different origin and stay absolute, matched by remotePatterns.
 */
const sameOriginRelative = (url: string) => {
  const base = siteUrl()
  return url.startsWith(base) ? url.slice(base.length) || '/' : url
}


export const mediaUrl = (m: unknown, size?: 'thumb' | 'card' | 'full') => {
  const doc = asDoc<Media>(m as Media)
  if (!doc) return null
  const url = (size && doc.sizes?.[size]?.url) || doc.url
  return url ? sameOriginRelative(url) : null
}

/** The first of `candidates` that has a file, with its stored blur-up preview. */
export const pic = (size: 'thumb' | 'card' | 'full', ...candidates: unknown[]) => {
  for (const m of candidates) {
    const src = mediaUrl(m, size)
    if (src) return { src, blur: asDoc<Media>(m as Media)?.blurDataURL ?? null }
  }
  return null
}
