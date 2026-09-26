import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'

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
  ],
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
