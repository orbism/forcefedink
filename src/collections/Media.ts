import { readFile } from 'node:fs/promises'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { placeholder } from '../lib/placeholder'
import { anyone, isAdmin } from '../access'

/** Every new or replaced image gets its blur-up preview stored with it. */
const blur: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file
  if (!file?.mimetype?.startsWith('image/')) return data
  const bytes = file.data?.length ? file.data : file.tempFilePath ? await readFile(file.tempFilePath) : null
  return bytes ? { ...data, blurDataURL: await placeholder(bytes) } : data
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen readers and search.' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Photographer or source, if the work is not the artist’s own photo.' },
    },
    { name: 'blurDataURL', type: 'text', admin: { hidden: true, readOnly: true } },
  ],
  hooks: { beforeChange: [blur] },
  upload: {
    // Vercel Blob (or disk locally) serves these; sizes keep artwork pages light.
    imageSizes: [
      { name: 'thumb', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 800, height: undefined, position: 'centre' },
      { name: 'full', width: 1800, height: undefined, position: 'centre' },
    ],
    mimeTypes: ['image/*', 'audio/*'],
    focalPoint: true,
  },
}
