/**
 * Stores a blur-up preview on every image that lacks one: `pnpm media:blur`.
 *
 * New uploads get theirs on upload (collections/Media.ts); this backfills the rest. Writes
 * only the `blurDataURL` field, skips images that already have one, never deletes.
 */
import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'

import { placeholder } from '../src/lib/placeholder'

const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'media',
  where: { and: [{ mimeType: { like: 'image/' } }, { blurDataURL: { exists: false } }] },
  pagination: false,
  depth: 0,
})

let done = 0
for (const m of docs) {
  // Local uploads sit in ./media; Blob-hosted ones are fetched from their URL.
  const bytes = await readFile(path.resolve('media', m.filename ?? '')).catch(async () =>
    m.url ? Buffer.from(await (await fetch(m.url)).arrayBuffer()) : null,
  )
  if (!bytes) {
    console.log(`skipped ${m.filename}: file not found`)
    continue
  }
  await payload.update({ collection: 'media', id: m.id, data: { blurDataURL: await placeholder(bytes) } })
  done++
}
console.log(`media blur: ${done} of ${docs.length} images given a preview`)
process.exit(0)
