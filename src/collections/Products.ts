import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook, Field } from 'payload'

import { slugField } from '../fields/slug'
import { bust } from '../hooks/revalidate'

/**
 * Everything for sale lives here: editions (numbered print runs), originals (one-offs)
 * and merch. The ecommerce plugin supplies price, inventory and size options; this adds
 * what the site needs to present each kind.
 *
 * Inventory is what's left. For an edition that is the unsold prints, so sold = run − inventory.
 * With size options on, each size (variant) carries its own run and inventory.
 */
const kindIs = (k: string) => (data: Record<string, unknown> | undefined) => data?.kind === k

const fields: Field[] = [
  { name: 'title', type: 'text', required: true },
  slugField(),
  {
    name: 'kind',
    type: 'select',
    required: true,
    defaultValue: 'edition',
    options: [
      { label: 'Edition', value: 'edition' },
      { label: 'Original', value: 'original' },
      { label: 'Merch', value: 'merch' },
    ],
    admin: { position: 'sidebar' },
  },
  {
    name: 'artwork',
    type: 'relationship',
    relationTo: 'artworks',
    admin: { condition: (data) => data?.kind !== 'merch', description: 'The drawing this is made from.' },
  },
  {
    name: 'images',
    type: 'array',
    admin: { description: 'Product shots. Editions and originals fall back to the artwork’s images.' },
    fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
  },
  { name: 'description', type: 'textarea' },
  {
    name: 'edition',
    type: 'group',
    admin: { condition: kindIs('edition') },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'status',
            type: 'select',
            defaultValue: 'upcoming',
            options: [
              { label: 'Upcoming', value: 'upcoming' },
              { label: 'Open', value: 'live' },
              { label: 'Sold out', value: 'soldout' },
              { label: 'Archived', value: 'archived' },
            ],
            admin: { width: '50%' },
          },
          { name: 'release', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
        ],
      },
      {
        name: 'runSize',
        type: 'number',
        min: 1,
        admin: { description: 'Prints in the run. With size options on, set the run on each size instead.' },
      },
      {
        type: 'row',
        fields: [
          { name: 'paper', type: 'text', admin: { width: '50%', placeholder: 'Hahnemühle Photo Rag 308gsm' } },
          { name: 'size', type: 'text', admin: { width: '50%', placeholder: '16 × 20 in', description: 'Without size options.' } },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'signed', type: 'checkbox', defaultValue: true },
          { name: 'numbered', type: 'checkbox', defaultValue: true },
        ],
      },
      { name: 'shipNote', type: 'textarea', admin: { description: 'Falls back to the site-wide shipping note.' } },
    ],
  },
  {
    name: 'original',
    type: 'group',
    admin: { condition: kindIs('original') },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'status',
            type: 'select',
            defaultValue: 'available',
            options: [
              { label: 'Available', value: 'available' },
              { label: 'Reserved', value: 'reserved' },
              { label: 'Sold', value: 'sold' },
            ],
            admin: { width: '50%' },
          },
          { name: 'dimensions', type: 'text', admin: { width: '50%' } },
        ],
      },
      { name: 'framed', type: 'checkbox' },
    ],
  },
]

/** An open, single-size edition with nothing left is sold out — don't rely on the editor to notice. */
const autoSoldOut: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.kind === 'edition' && !data.enableVariants && data.edition?.status === 'live' && data.inventory === 0) {
    return { ...data, edition: { ...data.edition, status: 'soldout' } }
  }
  return data
}

/** Everywhere a product or one of its sizes appears: lists, edition pages, and the artwork
 *  pages that sell the originals. Saving a draft refreshes too, harmlessly. */
const SHOP_PAGES = ['/', '/editions', '/originals', '/archive', '/(frontend)/editions/[slug]', '/(frontend)/artwork/[slug]']
const revalidate: CollectionAfterChangeHook = ({ doc }) => {
  bust(SHOP_PAGES)
  return doc
}
const revalidateDelete: CollectionAfterDeleteHook = ({ doc }) => {
  bust(SHOP_PAGES)
  return doc
}

/** An original is one of one: its status says whether it's for sale, so stock is hidden. */
const hideStockOnOriginals = (f: Field): Field =>
  f.type === 'number' && f.name === 'inventory'
    ? { ...f, admin: { ...f.admin, condition: (data) => !data?.enableVariants && data?.kind !== 'original' } }
    : f

export const productsOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'inventory', '_status'],
    group: 'Shop',
  },
  fields: [...fields, ...defaultCollection.fields.map(hideStockOnOriginals)],
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), autoSoldOut],
    afterChange: [...(defaultCollection.hooks?.afterChange ?? []), revalidate],
    afterDelete: [...(defaultCollection.hooks?.afterDelete ?? []), revalidateDelete],
  },
})

/** Each size of an edition is its own numbered run. */
export const variantsOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection.hooks,
    afterChange: [...(defaultCollection.hooks?.afterChange ?? []), revalidate],
    afterDelete: [...(defaultCollection.hooks?.afterDelete ?? []), revalidateDelete],
  },
  fields: [
    ...defaultCollection.fields,
    { name: 'runSize', type: 'number', min: 1, admin: { description: 'Prints in this size’s run.' } },
  ],
})
