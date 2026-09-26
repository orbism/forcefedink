import type { Drop, Media, Original } from '@/payload-types'

import { siteUrl } from './site-url'

export const money = (n?: number | null) =>
  typeof n === 'number' ? `$${n.toLocaleString('en-US')}` : null

/** What a drop's availability actually says to a buyer. */
export function dropAvailability(drop: Drop) {
  const size = drop.editionSize ?? 0
  const sold = drop.editionsSold ?? 0
  const remaining = Math.max(0, size - sold)

  if (drop.status === 'upcoming') {
    return { label: 'Coming soon', remaining, soldOut: false, available: false } as const
  }
  if (drop.status === 'soldout' || remaining === 0) {
    return { label: 'Sold out', remaining: 0, soldOut: true, available: false } as const
  }
  if (drop.status === 'archived') {
    return { label: 'Archived', remaining, soldOut: true, available: false } as const
  }
  return {
    label: `${remaining} of ${size} remaining`,
    remaining,
    soldOut: false,
    available: true,
  } as const
}

export function originalAvailability(original?: Original | null) {
  if (!original) return null
  if (original.status === 'sold') return { label: 'Sold', price: null, available: false } as const
  if (original.status === 'reserved') return { label: 'Reserved', price: null, available: false } as const
  return {
    label: money(original.price) ?? 'Contact for price',
    price: original.price ?? null,
    available: true,
  } as const
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
