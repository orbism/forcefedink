import type { Artwork, Product, Variant } from '@/payload-types'

import { asDoc } from './format'

/**
 * Products as the site presents them. The ecommerce plugin stores prices in cents and
 * stock as "inventory" (what's left); pages work in dollars, run size, remaining and sold.
 */
export type EditionSize = { label: string; run: number; remaining: number; price: number | null }

export type Edition = {
  id: number
  slug: string
  title: string
  description: string | null
  artwork: Artwork | null
  images: Product['images']
  status: 'upcoming' | 'live' | 'soldout' | 'archived'
  release: string | null
  run: number
  remaining: number
  sold: number
  /** Lowest price across sizes, in dollars. */
  price: number | null
  paper: string | null
  size: string | null
  signed: boolean
  numbered: boolean
  shipNote: string | null
  sizes: EditionSize[]
}

export type OriginalListing = {
  title: string
  description: string | null
  artwork: Artwork | null
  status: 'available' | 'reserved' | 'sold'
  price: number | null
  dimensions: string | null
  framed: boolean
}

const dollars = (cents?: number | null, enabled?: boolean | null) =>
  enabled && typeof cents === 'number' ? cents / 100 : null

export function toEdition(p: Product): Edition {
  const variants = (p.enableVariants ? p.variants?.docs ?? [] : [])
    .map((v) => asDoc<Variant>(v))
    .filter((v): v is Variant => Boolean(v))
  const sizes: EditionSize[] = variants.map((v) => ({
    // The plugin titles a variant "Product — Option"; the page only needs the option.
    label: (v.title ?? '').replace(`${p.title} — `, ''),
    run: v.runSize ?? 0,
    remaining: v.inventory ?? 0,
    price: dollars(v.priceInUSD, v.priceInUSDEnabled),
  }))
  sizes.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  const run = sizes.length ? sizes.reduce((n, s) => n + s.run, 0) : p.edition?.runSize ?? 0
  const remaining = sizes.length ? sizes.reduce((n, s) => n + s.remaining, 0) : p.inventory ?? 0
  const prices = sizes.map((s) => s.price).filter((n): n is number => n !== null)
  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    title: p.title,
    description: p.description ?? null,
    artwork: asDoc<Artwork>(p.artwork),
    images: p.images,
    status: p.edition?.status ?? 'upcoming',
    release: p.edition?.release ?? null,
    run,
    remaining,
    sold: Math.max(0, run - remaining),
    price: prices.length ? Math.min(...prices) : dollars(p.priceInUSD, p.priceInUSDEnabled),
    paper: p.edition?.paper ?? null,
    size: p.edition?.size ?? null,
    signed: p.edition?.signed ?? false,
    numbered: p.edition?.numbered ?? false,
    shipNote: p.edition?.shipNote ?? null,
    sizes,
  }
}

export function toOriginal(p: Product): OriginalListing {
  return {
    title: p.title,
    description: p.description ?? null,
    artwork: asDoc<Artwork>(p.artwork),
    status: p.original?.status ?? 'available',
    price: dollars(p.priceInUSD, p.priceInUSDEnabled),
    dimensions: p.original?.dimensions ?? null,
    framed: Boolean(p.original?.framed),
  }
}
