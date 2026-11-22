/**
 * Copies the retired Drops and Originals collections into Products: `pnpm shop:copy`.
 *
 * Safe to re-run: anything whose slug already exists in Products is skipped, and nothing
 * is ever deleted. Drops and Originals stay in the database until the copy is verified
 * and they are removed on purpose.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

const cents = (dollars?: number | null) => (typeof dollars === 'number' ? Math.round(dollars * 100) : null)
const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null))

export async function copyShop(payload: Payload) {
  const has = async (slug: string) =>
    (await payload.count({ collection: 'products', where: { slug: { equals: slug } }, overrideAccess: true })).totalDocs > 0
  let made = 0
  let skipped = 0

  const drops = await payload.find({ collection: 'drops', depth: 0, limit: 1000, pagination: false })
  for (const d of drops.docs) {
    if (!d.slug || (await has(d.slug))) {
      skipped++
      continue
    }
    const price = cents(d.price)
    await payload.create({
      collection: 'products',
      draft: false,
      data: {
        _status: 'published',
        title: d.title,
        slug: d.slug,
        kind: 'edition',
        artwork: idOf(d.artwork),
        images: (d.images ?? []).map((i) => ({ image: idOf(i.image) as number })),
        edition: {
          status: d.status,
          release: d.released ?? null,
          runSize: d.editionSize,
          paper: d.printDetails?.paper ?? null,
          size: d.printDetails?.size ?? null,
          signed: d.printDetails?.signed ?? true,
          numbered: d.printDetails?.numbered ?? true,
          shipNote: d.shipNote ?? null,
        },
        inventory: Math.max(0, d.editionSize - (d.editionsSold ?? 0)),
        priceInUSDEnabled: price !== null,
        priceInUSD: price,
        ...(d.meta ? { meta: { ...d.meta, image: idOf(d.meta.image) } } : {}),
      },
    })
    made++
  }

  const originals = await payload.find({ collection: 'originals', depth: 1, limit: 1000, pagination: false })
  for (const o of originals.docs) {
    const art = o.artwork && typeof o.artwork === 'object' ? o.artwork : null
    const slug = `${art?.slug ?? `artwork-${idOf(o.artwork)}`}-original`
    if (await has(slug)) {
      skipped++
      continue
    }
    const price = cents(o.price)
    await payload.create({
      collection: 'products',
      draft: false,
      data: {
        _status: 'published',
        title: o.title || art?.title || slug,
        slug,
        kind: 'original',
        artwork: idOf(o.artwork),
        original: { status: o.status, dimensions: o.dimensions ?? null, framed: Boolean(o.framed) },
        inventory: o.status === 'sold' ? 0 : 1,
        priceInUSDEnabled: price !== null,
        priceInUSD: price,
      },
    })
    made++
  }

  const count = async (kind: 'edition' | 'original') =>
    (await payload.count({ collection: 'products', where: { kind: { equals: kind } }, overrideAccess: true })).totalDocs
  const [eds, origs] = [await count('edition'), await count('original')]
  console.log(`shop copy: ${made} created, ${skipped} already there`)
  console.log(`drops ${drops.totalDocs} → edition products ${eds}; originals ${originals.totalDocs} → original products ${origs}`)
  return { ok: eds >= drops.totalDocs && origs >= originals.totalDocs }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const payload = await getPayload({ config })
  const { ok } = await copyShop(payload)
  console.log(ok ? 'verified: every drop and original has a product' : 'MISMATCH: check the counts above')
  process.exit(ok ? 0 : 1)
}
