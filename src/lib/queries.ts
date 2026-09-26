import { cache } from 'react'

import { getPayloadClient } from './payload'

/** Deduped per-request so the shell and the page don't fetch settings twice. */
export const getSiteSettings = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})

export const getCommissions = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'commissions', depth: 0 })
})

/** Drops the public should see, newest first. Upcoming and live before archived. */
export const getDrops = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'drops',
    depth: 2,
    limit: 100,
    sort: '-released',
  })
  return docs
})

export const getDrop = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'drops',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
})

export const getSeriesList = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'series', depth: 1, limit: 100, sort: 'order' })
  return docs
})

export const getSeries = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'series',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
})

export const getArtworks = cache(async (seriesId?: number | string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'artworks',
    depth: 2,
    limit: 200,
    sort: '-year',
    ...(seriesId ? { where: { series: { equals: seriesId } } } : {}),
  })
  return docs
})

export const getArtwork = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'artworks',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
})

/** The original for an artwork, if one is listed. */
export const getOriginalFor = cache(async (artworkId: number | string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'originals',
    where: { artwork: { equals: artworkId } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
})

export const getFaqs = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'faqs', limit: 100, sort: 'order' })
  return docs
})

/** The next drop worth counting down to: soonest upcoming release. */
export const getNextDrop = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'drops',
    where: { status: { equals: 'upcoming' }, released: { exists: true } },
    sort: 'released',
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
})

/** Closed runs, newest first — the track record under the countdown. */
export const getPastDrops = cache(async (limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'drops',
    where: { status: { in: ['soldout', 'archived'] } },
    sort: '-released',
    depth: 2,
    limit,
  })
  return docs
})
