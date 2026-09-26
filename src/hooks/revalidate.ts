import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/**
 * Pages are prerendered, so an edit in the admin would otherwise not surface until the
 * next deploy — unacceptable when `editionsSold` is what tells a buyer whether a drop is
 * still open. These push the affected paths on save instead.
 */
const bust = (paths: (string | null | undefined)[]) => {
  for (const path of paths) {
    if (!path) continue
    try {
      revalidatePath(path)
    } catch {
      // Outside a Next request context — a seed or migration script, for instance —
      // revalidatePath throws "static generation store missing". There is no cache to
      // bust in that case, so writing through the CLI should not fail because of it.
    }
  }
}

/** `list` is the index page; `detail` builds the per-doc path from its slug. */
export const revalidateCollection =
  (list: string, detail?: (slug: string) => string): CollectionAfterChangeHook =>
  ({ doc, previousDoc }) => {
    const slugs = [doc?.slug, previousDoc?.slug].filter(Boolean) as string[]
    bust([list, '/', ...(detail ? slugs.map(detail) : [])])
    return doc
  }

export const revalidateCollectionDelete =
  (list: string, detail?: (slug: string) => string): CollectionAfterDeleteHook =>
  ({ doc }) => {
    bust([list, '/', ...(detail && doc?.slug ? [detail(doc.slug)] : [])])
    return doc
  }

/** Globals feed the shell, so a change touches every page. */
export const revalidateGlobal =
  (paths: string[]): GlobalAfterChangeHook =>
  ({ doc }) => {
    bust(['/', ...paths])
    return doc
  }
