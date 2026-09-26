import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

export const Commissions: GlobalConfig = {
  slug: 'commissions',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'open',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Drives the open/closed badge on the commissions page.' },
    },
    { name: 'blurb', type: 'richText' },
    {
      name: 'waitlist',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show the enquiry form even while commissions are closed.' },
    },
  ],
  hooks: { afterChange: [revalidateGlobal(['/commissions'])] },
}
