import type { Access, FieldAccess } from 'payload'

/** Signed-in admin. The only user type that exists right now. */
export const isAdmin: Access = ({ req }) => Boolean(req.user)
export const isAdminField: FieldAccess = ({ req }) => Boolean(req.user)

/** Public reads, admin writes — the default for anything the site renders. */
export const anyone: Access = () => true
