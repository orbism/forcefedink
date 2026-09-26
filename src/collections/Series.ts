import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection, revalidateCollectionDelete } from '../hooks/revalidate'

/** Themed archive sections — Islamic Geometry, Calculus, Paintings, and so on. */
export const Series: CollectionConfig = {
  slug: 'series',
  labels: { singular: 'Series', plural: 'Series' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'order'], group: 'Content' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    { name: 'blurb', type: 'textarea', admin: { description: 'One or two lines, shown on the archive index.' } },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers sort first.' },
    },
  ],
  hooks: {
    afterChange: [revalidateCollection('/archive', (slug) => `/archive/${slug}`)],
    afterDelete: [revalidateCollectionDelete('/archive', (slug) => `/archive/${slug}`)],
  },
}
