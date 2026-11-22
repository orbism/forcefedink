import type { Access, FieldAccess } from 'payload'

/** Signed-in admin. The only user type that exists right now. */
export const isAdmin: Access = ({ req }) => Boolean(req.user)
export const isAdminField: FieldAccess = ({ req }) => Boolean(req.user)

/** Public reads, admin writes — the default for anything the site renders. */
export const anyone: Access = () => true

/** Shop: the public sees published products and variants; admins see drafts too. */
export const adminOrPublished: Access = ({ req }) => (req.user ? true : { _status: { equals: 'published' } })

/**
 * Shop: orders, carts and addresses belong to a customer. Customer accounts don't exist
 * yet (guest checkout), so only admins read or edit them.
 */
export const adminOnly: Access = ({ req }) => Boolean(req.user)
