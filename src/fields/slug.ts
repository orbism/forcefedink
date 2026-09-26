import type { Field } from 'payload'

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** URL slug, auto-derived from `from` on create unless the editor sets one. */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Leave blank to generate from the title.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        const source = typeof value === 'string' && value.length ? value : data?.[from]
        return typeof source === 'string' ? slugify(source) : value
      },
    ],
  },
})
