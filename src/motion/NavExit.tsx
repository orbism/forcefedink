'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { prefersReducedMotion } from './useInkReveal'

/** How long the outgoing page gets to clear. Matches the exit transitions in PageStage. */
const EXIT_MS = 240

/**
 * Plays the outgoing page's exit before any internal navigation.
 *
 * React's <ViewTransition> was the first choice, but with Next 16.3's router the
 * navigation commit never reached React's view-transition path (no transition names were
 * ever applied, in dev or production). This is the deterministic replacement: intercept
 * internal link clicks in the capture phase, mark the document as leaving so the stage's
 * CSS exits run, then navigate. Browser back/forward skip the exit; entrances still play.
 */
export function NavExit() {
  const router = useRouter()
  const pathname = usePathname()

  // The new route has committed: clear the flag so its own entrance can run.
  useEffect(() => {
    delete document.documentElement.dataset.leaving
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return

      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin || /^\/(admin|api)(\/|$)/.test(url.pathname)) return
      if (url.pathname === location.pathname && url.search === location.search) return
      if (prefersReducedMotion()) return

      // Taking over from <Link>: it skips navigation once the event is defaultPrevented.
      e.preventDefault()
      const href = url.pathname + url.search + url.hash
      router.prefetch(href)
      document.documentElement.dataset.leaving = 'true'
      window.setTimeout(() => router.push(href), EXIT_MS)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  return null
}
