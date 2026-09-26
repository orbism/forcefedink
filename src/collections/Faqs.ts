import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { revalidateCollection, revalidateCollectionDelete } from '../hooks/revalidate'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'category', 'order'], group: 'Content' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: 'order',
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'general',
      options: [
        { label: 'Prints & drops', value: 'prints' },
        { label: 'Shipping', value: 'shipping' },
        { label: 'Originals', value: 'originals' },
        { label: 'Commissions', value: 'commissions' },
        { label: 'General', value: 'general' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
  hooks: {
    afterChange: [revalidateCollection('/faq')],
    afterDelete: [revalidateCollectionDelete('/faq')],
  },
}
