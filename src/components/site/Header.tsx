'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Ammonite } from './Ammonite'
import { NAV } from './nav'
import styles from './Header.module.css'

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className={styles.header} data-home={pathname === '/' || undefined}>
        <Link href="/" className={styles.brand}>
          <Ammonite size={48} className={styles.mark} />
          <span className={styles.wordmark}>Force Fed Ink</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className={styles.burger}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.burgerBox} data-open={open || undefined}>
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </header>

      <nav id="site-menu" className={styles.drawer} hidden={!open} aria-label="Primary">
        {NAV.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.drawerLink}
            style={{ '--i': i } as React.CSSProperties}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
