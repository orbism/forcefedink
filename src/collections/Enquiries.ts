import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

/**
 * Written by the public enquiry form via the local API (overrideAccess), read only by admins.
 * Public create access stays `false` so the REST endpoint can't be posted to directly.
 */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'type', 'subjectTitle', 'handled', 'createdAt'],
    group: 'Inbox',
  },
  access: { read: isAdmin, create: () => false, update: isAdmin, delete: isAdmin },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Print', value: 'print' },
        { label: 'Original', value: 'original' },
        { label: 'Commission', value: 'commission' },
        { label: 'General', value: 'general' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
      ],
    },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'subjectTitle',
      type: 'text',
      admin: { readOnly: true, description: 'What the enquiry was about, captured at submit time.' },
    },
    { name: 'subjectUrl', type: 'text', admin: { readOnly: true } },
    {
      name: 'handled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
