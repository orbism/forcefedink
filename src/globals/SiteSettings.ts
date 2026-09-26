import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'announcement',
      type: 'group',
      label: 'Announcement bar',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'text', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'tagline', type: 'text', admin: { placeholder: 'Original ink. Limited runs.' } },
        { name: 'intro', type: 'textarea' },
        {
          name: 'band',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'The wide artwork strip under the wordmark.' },
        },
      ],
    },
    {
      name: 'shippingDisclaimer',
      type: 'textarea',
      required: true,
      defaultValue: 'All prints in a drop ship together once the run closes.',
      admin: { description: 'Shown on every drop page and in the FAQ.' },
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    { name: 'footerNote', type: 'text' },
    {
      name: 'audio',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Track for the footer player. Leave empty to hide the player.' },
    },
    { name: 'audioTitle', type: 'text', admin: { description: 'Label shown in the player tray.' } },
  ],
  hooks: { afterChange: [revalidateGlobal(['/faq', '/drops'])] },
}
