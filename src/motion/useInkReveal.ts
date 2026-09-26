'use client'

import { type RefObject, useEffect, useState } from 'react'

import type { RevealState } from './types'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Drives an element's reveal from whether it is on screen. */
export function useInkReveal(
  ref: RefObject<HTMLElement | null>,
  { threshold = 0.15, once = false }: { threshold?: number; once?: boolean } = {},
): RevealState {
  const [state, setState] = useState<RevealState>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      setState('held')
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setState((s) => (s === 'held' ? s : 'drawing'))
        else if (!once) setState((s) => (s === 'idle' ? s : 'undrawing'))
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, once])

  return state
}
