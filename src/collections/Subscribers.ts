import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'source', 'createdAt'], group: 'Inbox' },
  access: { read: isAdmin, create: () => false, update: isAdmin, delete: isAdmin },
  defaultSort: '-createdAt',
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    {
      name: 'source',
      type: 'text',
      admin: { readOnly: true, description: 'Which page the sign-up came from.' },
    },
    { name: 'unsubscribed', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
