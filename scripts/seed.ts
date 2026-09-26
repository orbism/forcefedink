/**
 * Populates a cold database with a browsable site: `pnpm seed`.
 * Idempotent — it clears the content collections it owns before re-inserting.
 *
 * Placeholder artwork is rendered from the procedural motifs, so a seeded site looks
 * like the real thing rather than a wall of grey boxes.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

import { brushSet } from '../src/brush/strokes'

const ADMIN_EMAIL = process.env.SEED_EMAIL ?? 'studio@forcefedink.com'
const ADMIN_PASSWORD = process.env.SEED_PASSWORD ?? 'changeme123'

/** Placeholder artwork: gold brushstrokes on canvas, so a seeded site looks like the real thing. */
const placeholderPng = async (seed: number, out: string, size = 1600) => {
  const set = brushSet(seed, 5, 400)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${set.viewBox}" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="#26242b"/>
    ${set.strokes.map((st, i) => `<path d="${st.outline}" fill="#ddd7a2" opacity="${0.7 + 0.3 * ((i % 3) / 2)}"/>`).join('')}
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(out)
  return out
}

const ARTWORKS = [
  { key: 'rosette12', seed: 7, title: 'Twelvefold Rosette', series: 'islamic-geometry', year: 2025, featured: true },
  { key: 'rosette16', seed: 19, title: 'Sixteen Points', series: 'islamic-geometry', year: 2025, featured: true },
  { key: 'rosette10', seed: 31, title: 'Decagon Study', series: 'islamic-geometry', year: 2024, featured: false },
  { key: 'ammonite', seed: 43, title: 'Ammonite', series: 'shells', year: 2026, featured: true },
  { key: 'harmonograph', seed: 57, title: 'Harmonograph I', series: 'calculus', year: 2025, featured: false },
  { key: 'harmonographB', seed: 71, title: 'Harmonograph II', series: 'calculus', year: 2026, featured: true },
] as const

const SERIES = [
  { slug: 'islamic-geometry', title: 'Islamic Geometry', order: 0, blurb: 'Compass-and-straightedge constructions, drawn by hand in ink.' },
  { slug: 'calculus', title: 'Calculus', order: 1, blurb: 'Curves that come out of equations rather than intent.' },
  { slug: 'shells', title: 'Shells', order: 2, blurb: 'Logarithmic growth, over and over.' },
]

const rich = (text: string) =>
  ({
    root: {
      type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
          children: [
            { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
          ],
        },
      ],
    },
  })

async function seed() {
  const payload = await getPayload({ config })
  const dir = await mkdtemp(path.join(tmpdir(), 'ffi-seed-'))

  // Deleting the rows leaves the files behind, and the next run writes the same
  // filenames — so fresh rows silently resolve to the previous run's images.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    await rm(path.resolve('media'), { recursive: true, force: true })
  }

  // --- admin -------------------------------------------------------------
  const existing = await payload.find({ collection: 'users', limit: 1 })
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Christopher Edward Wedemire' },
    })
    console.log(`admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  } else {
    console.log('admin already exists — left alone')
  }

  // --- wipe content we own ----------------------------------------------
  for (const collection of ['drops', 'originals', 'artworks', 'series', 'faqs', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }

  // --- series ------------------------------------------------------------
  const seriesIds: Record<string, number> = {}
  for (const s of SERIES) {
    const doc = await payload.create({ collection: 'series', data: s })
    seriesIds[s.slug] = doc.id as number
  }

  // --- artworks (with rendered placeholder images) ------------------------
  const artworkIds: Record<string, number> = {}
  for (const a of ARTWORKS) {
    const file = await placeholderPng(a.seed, path.join(dir, `${a.key}.png`))
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${a.title} — geometric ink drawing` },
      filePath: file,
    })
    const doc = await payload.create({
      collection: 'artworks',
      data: {
        title: a.title,
        images: [{ image: media.id }],
        year: a.year,
        medium: 'Ink on paper',
        dimensions: '18 × 24 in',
        series: seriesIds[a.series],
        featured: a.featured,
        process: rich(
          'Constructed from a compass grid, then inked by hand. Every line is drawn in one pass — nothing is corrected after the fact.',
        ),
      },
    })
    artworkIds[a.key] = doc.id as number
  }

  // --- drops -------------------------------------------------------------
  await payload.create({
    collection: 'drops',
    data: {
      title: 'Twelvefold Rosette — Drop 01',
      artwork: artworkIds.rosette12,
      editionSize: 25, editionsSold: 18, price: 180, released: new Date('2026-07-01').toISOString(),
      status: 'live',
      printDetails: { paper: 'Hahnemühle German Etching 310gsm', size: '16 × 20 in', signed: true, numbered: true },
    },
  })
  await payload.create({
    collection: 'drops',
    data: {
      title: 'Ammonite — Drop 02',
      artwork: artworkIds.ammonite,
      editionSize: 40, editionsSold: 40, price: 220, released: new Date('2026-04-12').toISOString(),
      status: 'live', // the beforeChange hook flips this to soldout
      printDetails: { paper: 'Somerset Velvet 330gsm', size: '20 × 20 in', signed: true, numbered: true },
    },
  })
  await payload.create({
    collection: 'drops',
    data: {
      title: 'Harmonograph II — Drop 03',
      artwork: artworkIds.harmonographB,
      editionSize: 30, editionsSold: 0, price: 165, released: new Date('2026-10-01').toISOString(),
      status: 'upcoming',
      printDetails: { paper: 'Hahnemühle Photo Rag 308gsm', size: '16 × 16 in', signed: true, numbered: true },
    },
  })

  // --- originals ---------------------------------------------------------
  await payload.create({
    collection: 'originals',
    data: { artwork: artworkIds.rosette16, price: 2400, status: 'available', dimensions: '18 × 24 in', framed: true },
  })
  await payload.create({
    collection: 'originals',
    data: { artwork: artworkIds.ammonite, status: 'sold', dimensions: '20 × 20 in', framed: false },
  })
  await payload.create({
    collection: 'originals',
    data: { artwork: artworkIds.harmonograph, status: 'available', dimensions: '16 × 16 in', framed: false },
  })

  // --- faqs --------------------------------------------------------------
  const faqs = [
    ['When do prints ship?', 'shipping', 'All prints in a drop ship together once the run closes. If you order on day one you will not receive it before someone who orders on the last day.'],
    ['Are prints signed and numbered?', 'prints', 'Yes. Every print is signed and numbered by hand on the front lower edge.'],
    ['What happens when a drop sells out?', 'prints', 'It does not come back. Editions are fixed at the size announced and are never reprinted.'],
    ['Can I buy an original?', 'originals', 'Where an original is still available it is listed with its price. Where no price is shown, get in touch.'],
    ['Do you take commissions?', 'commissions', 'Sometimes. The commissions page says whether they are open right now.'],
  ] as const
  for (const [question, category, answer] of faqs) {
    await payload.create({
      collection: 'faqs',
      data: { question, category, answer: rich(answer), order: faqs.findIndex((f) => f[0] === question) },
    })
  }

  // --- globals -----------------------------------------------------------
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      hero: {
        tagline: 'Original ink. Limited runs.',
        intro:
          'Each drop is a fixed edition. When the run closes it does not come back — the prints ship together once the last one is spoken for.',
      },
      shippingDisclaimer: 'All prints in a drop ship together once the run closes.',
      socials: [{ label: 'Instagram', href: 'https://instagram.com/forcefedink' }],
      footerNote: 'Drawn by hand in ink.',
    },
  })
  await payload.updateGlobal({
    slug: 'commissions',
    data: {
      open: true,
      waitlist: true,
      blurb: rich('Commissions are open for geometric work on paper. Tell me the size, the space it is going into, and roughly when you need it.'),
    },
  })

  console.log('seeded: 3 series, 6 artworks, 3 drops, 3 originals, 5 faqs, globals')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
