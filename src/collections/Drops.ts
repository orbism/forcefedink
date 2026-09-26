import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection, revalidateCollectionDelete } from '../hooks/revalidate'

/**
 * A limited, numbered print run. Availability is derived, never stored:
 * remaining = editionSize - editionsSold. Phase 2 swaps the manual `editionsSold`
 * for a Stripe webhook without touching anything that reads it.
 */
export const Drops: CollectionConfig = {
  slug: 'drops',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'editionsSold', 'editionSize', 'released'],
    group: 'Shop',
  },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: '-released',
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    { name: 'artwork', type: 'relationship', relationTo: 'artworks', required: true },
    {
      name: 'images',
      type: 'array',
      admin: { description: 'Print-specific shots. Falls back to the artwork’s images if empty.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'editionSize',
          type: 'number',
          required: true,
          min: 1,
          admin: { width: '50%', description: 'Total prints in the run.' },
        },
        {
          name: 'editionsSold',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
          admin: { width: '50%', description: 'Set by hand until checkout goes live.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', min: 0, admin: { width: '50%', description: 'In USD. Blank renders “Contact”.' } },
        { name: 'released', type: 'date', admin: { width: '50%' } },
      ],
    },
    {
      name: 'printDetails',
      type: 'group',
      fields: [
        { name: 'paper', type: 'text', admin: { placeholder: 'Hahnemühle German Etching 310gsm' } },
        { name: 'size', type: 'text', admin: { placeholder: '16 × 20 in' } },
        { name: 'signed', type: 'checkbox', defaultValue: true },
        { name: 'numbered', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'shipNote',
      type: 'textarea',
      admin: { description: 'Drop-specific shipping note. Falls back to the site-wide disclaimer.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Live', value: 'live' },
        { label: 'Sold out', value: 'soldout' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [revalidateCollection('/drops', (slug) => `/drops/${slug}`)],
    afterDelete: [revalidateCollectionDelete('/drops', (slug) => `/drops/${slug}`)],
    // A live drop whose run is exhausted is sold out — don't rely on the editor to notice.
    beforeChange: [
      ({ data }) => {
        if (data?.status === 'live' && data.editionsSold >= data.editionSize) {
          return { ...data, status: 'soldout' }
        }
        return data
      },
    ],
  },
}
