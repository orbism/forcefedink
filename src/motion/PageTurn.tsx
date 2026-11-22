'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from './useInkReveal'
import styles from './PageTurn.module.css'

/** Longest a leftover sheet may linger if the next page never mounts a stage. */
const GHOST_MAX = 3000
/** Delay + slide of the old sheet retracting (PageTurn.module.css). */
const RECEDE_MS = 760

/** Same-origin page links the site owns, as a router href; null for anything else. */
function internalHref(target: EventTarget | null) {
  const a = (target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin || /^\/(admin|api)(\/|$)/.test(url.pathname)) return null
  return { a, url, href: url.pathname + url.search + url.hash }
}

/** Whether the previous history entry is a page on this site (Navigation API; else no). */
function hasPrevious() {
  const nav = (window as { navigation?: { currentEntry?: { index: number } | null } }).navigation
  return (nav?.currentEntry?.index ?? 0) > 0
}

/**
 * Sheet over sheet: on an internal link, the current page's sheet is copied into a layer
 * that stays put while the route changes; the new page's sheet then slides in over it from
 * its own side, and a beat later the old one retracts the way it came — so each section
 * turns differently. A link may ask to `data-hold` (ms) before leaving, e.g. for the purchase seal.
 * Pages also start loading when the pointer or a finger lands on their link. A `data-back`
 * link steps back through history when the previous entry is this site's.
 *
 * React's <ViewTransition> never fired on Next 16.3 navigations, hence doing it by hand.
 * Back/forward and reduced motion navigate plainly.
 */
export function PageTurn() {
  const router = useRouter()
  const pathname = usePathname()
  const ghost = useRef<HTMLElement | null>(null)

  // The new route has committed: the old sheet retracts the way it came, a beat later.
  useEffect(() => {
    const g = ghost.current
    if (!g) return
    ghost.current = null
    requestAnimationFrame(() => (g.dataset.go = ''))
    window.setTimeout(() => g.remove(), RECEDE_MS)
  }, [pathname])

  useEffect(() => {
    const leaveCopy = () => {
      const stage = document.querySelector<HTMLElement>('main [data-from]')
      const canvas = stage?.querySelector<HTMLElement>('[data-side]')
      if (!stage || !canvas) return
      // A copy of the stage shell (for its layout variables) holding only the sheet.
      const layer = stage.cloneNode(false) as HTMLElement
      layer.classList.add(styles.ghost)
      layer.setAttribute('aria-hidden', 'true')
      layer.setAttribute('inert', '')
      const sheet = canvas.cloneNode(true) as HTMLElement
      layer.append(sheet)
      document.body.append(layer)
      const from = canvas.querySelector('[class*="scroll"]')
      const to = sheet.querySelector('[class*="scroll"]')
      if (from && to) to.scrollTop = from.scrollTop
      ghost.current?.remove()
      ghost.current = layer
      window.setTimeout(() => layer.remove(), GHOST_MAX)
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = internalHref(e.target)
      if (!link) return
      if (link.url.pathname === location.pathname && link.url.search === location.search) return
      const back = link.a.hasAttribute('data-back') && hasPrevious()
      if (prefersReducedMotion()) {
        if (back) {
          e.preventDefault()
          router.back()
        }
        return
      }
      // Taking over from <Link>: it skips navigation once the event is defaultPrevented.
      e.preventDefault()
      if (back) {
        leaveCopy()
        router.back()
        return
      }
      router.prefetch(link.href)
      window.setTimeout(() => {
        leaveCopy()
        router.push(link.href)
      }, Number(link.a.dataset.hold) || 0)
    }
    const seen = new Set<string>()
    const onIntent = (e: Event) => {
      const link = internalHref(e.target)
      if (!link || seen.has(link.href)) return
      seen.add(link.href)
      router.prefetch(link.href)
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('pointerover', onIntent, { passive: true })
    document.addEventListener('touchstart', onIntent, { passive: true })
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('pointerover', onIntent)
      document.removeEventListener('touchstart', onIntent)
    }
  }, [router])

  return null
}
