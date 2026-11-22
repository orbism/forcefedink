import type { Where } from 'payload'
import { cache } from 'react'

import { getPayloadClient } from './payload'
import { toEdition, toOriginal } from './shop'

/** Products are drafted in the admin; the site only ever shows published ones. */
const PUBLISHED: Where = { _status: { equals: 'published' } }

/** Deduped per-request so the shell and the page don't fetch settings twice. */
export const getSiteSettings = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})

export const getCommissions = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'commissions', depth: 0 })
})

/** Published editions, with their size options populated. */
const editions = async (where: Where[], sort?: string, limit = 100) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [PUBLISHED, { kind: { equals: 'edition' } }, ...where] },
    sort,
    depth: 2,
    limit,
  })
  return docs.map(toEdition)
}

/** Every published edition, newest release first. */
export const getEditions = cache(() => editions([], '-edition.release'))

export const getEdition = cache(async (slug: string) => (await editions([{ slug: { equals: slug } }], undefined, 1))[0] ?? null)

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

/** The original for an artwork, if one is listed for sale. */
export const getOriginalFor = cache(async (artworkId: number | string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [PUBLISHED, { kind: { equals: 'original' } }, { artwork: { equals: artworkId } }] },
    depth: 0,
    limit: 1,
  })
  return docs[0] ? toOriginal(docs[0]) : null
})

/** Every published original, with its artwork for the image and link. */
export const getOriginals = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [PUBLISHED, { kind: { equals: 'original' } }] },
    sort: '-createdAt',
    depth: 2,
    limit: 200,
  })
  return docs.map(toOriginal)
})

export const getFaqs = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'faqs', limit: 100, sort: 'order' })
  return docs
})

/** The next edition worth counting down to: soonest upcoming release. */
export const getNextEdition = cache(
  async () =>
    (await editions([{ 'edition.status': { equals: 'upcoming' } }, { 'edition.release': { exists: true } }], 'edition.release', 1))[0] ?? null,
)

/** Closed runs, newest first — the track record under the countdown. */
export const getPastEditions = cache((limit = 6) => editions([{ 'edition.status': { in: ['soldout', 'archived'] } }], '-edition.release', limit))
