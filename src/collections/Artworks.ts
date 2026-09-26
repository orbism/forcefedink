import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection, revalidateCollectionDelete } from '../hooks/revalidate'

export const Artworks: CollectionConfig = {
  slug: 'artworks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'series', 'year', 'featured'],
    group: 'Content',
  },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      required: true,
      admin: { description: 'First image is the one used in grids and as the share image.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', admin: { width: '33%' } },
        { name: 'medium', type: 'text', admin: { width: '33%', placeholder: 'Ink on paper' } },
        { name: 'dimensions', type: 'text', admin: { width: '34%', placeholder: '18 × 24 in' } },
      ],
    },
    {
      name: 'process',
      type: 'richText',
      admin: { description: 'How the piece was made. Shown on the artwork page.' },
    },
    { name: 'series', type: 'relationship', relationTo: 'series', admin: { position: 'sidebar' } },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Surface this on the landing page.' },
    },
    {
      name: 'motif',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Optional SVG line drawing used for the draw-in animation on this page.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateCollection('/archive', (slug) => `/artwork/${slug}`)],
    afterDelete: [revalidateCollectionDelete('/archive', (slug) => `/artwork/${slug}`)],
  },
}
