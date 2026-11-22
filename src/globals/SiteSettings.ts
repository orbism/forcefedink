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
      name: 'about',
      type: 'group',
      fields: [
        { name: 'byline', type: 'text', admin: { description: 'One line above the portrait and bio.' } },
        { name: 'bio', type: 'richText', admin: { description: 'The About page text. Wraps around the portrait.' } },
        { name: 'portrait', type: 'upload', relationTo: 'media', admin: { description: 'Shown top left on the About page.' } },
      ],
    },
    {
      name: 'shipping',
      type: 'group',
      label: 'Shipping page',
      fields: [
        { name: 'body', type: 'richText', admin: { description: 'Packing, dispatch and delivery. Wraps around the image.' } },
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Landscape works best.' } },
      ],
    },
    {
      name: 'shippingDisclaimer',
      type: 'textarea',
      required: true,
      defaultValue: 'Editions ship together when the run closes.',
      admin: { description: 'Shown on every edition page and in the FAQ.' },
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
  hooks: { afterChange: [revalidateGlobal(['/faq', '/editions', '/about', '/shipping'])] },
}
