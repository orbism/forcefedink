export const NAV = [
  { href: '/editions', label: 'Editions' },
  { href: '/originals', label: 'Originals' },
  { href: '/archive', label: 'Archive' },
  { href: '/commissions', label: 'Commissions' },
  { href: '/about', label: 'About' },
] as const

/** Set apart from the nav as a button. */
export const CONTACT = { href: '/contact', label: 'Contact' } as const
