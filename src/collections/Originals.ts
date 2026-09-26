import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { revalidateCollection, revalidateCollectionDelete } from '../hooks/revalidate'

/** The one-of-one drawing behind an artwork. Price may be blank, meaning "Contact". */
export const Originals: CollectionConfig = {
  slug: 'originals',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'price'], group: 'Shop' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Leave blank to use the artwork’s title.' },
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' && value.length ? value : undefined)],
      },
    },
    { name: 'artwork', type: 'relationship', relationTo: 'artworks', required: true, unique: true },
    {
      name: 'price',
      type: 'number',
      min: 0,
      admin: { description: 'In USD. Leave blank to render “Contact for price”.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'dimensions', type: 'text', admin: { width: '50%' } },
        { name: 'framed', type: 'checkbox', admin: { width: '50%' } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Reserved', value: 'reserved' },
        { label: 'Sold', value: 'sold' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [revalidateCollection('/archive')],
    afterDelete: [revalidateCollectionDelete('/archive')],
  },
}
