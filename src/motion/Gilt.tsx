'use client'

import { useEffect } from 'react'

import { buttonStyles } from '@/components/ui/EnquiryButton'
import { frameStyles } from '@/components/ui/Frame'

/** Tilt range, degrees, for artwork frames. */
const TILT_X = 9
const TILT_Y = 11
const SEL = `.${frameStyles.frame}, .${buttonStyles.btn}`

/**
 * Gilt light: a gold catch-light follows the mouse across artwork and buttons; artwork also
 * tilts a little toward it, like leaf turned under a lamp. Mouse only; styles in base.css.
 */
export function Gilt() {
  useEffect(() => {
    let cur: HTMLElement | null = null
    const reset = () => {
      if (!cur) return
      cur.style.setProperty('--o', '0')
      cur.style.removeProperty('--rx')
      cur.style.removeProperty('--ry')
      delete cur.dataset.giltLive
      cur = null
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(SEL) ?? null
      if (el !== cur) reset()
      if (!el) return
      cur = el
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.dataset.gilt = el.classList.contains(frameStyles.frame) ? 'tilt' : ''
      el.dataset.giltLive = ''
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      el.style.setProperty('--o', '1')
      el.style.setProperty('--rx', `${((0.5 - y) * TILT_X).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((x - 0.5) * TILT_Y).toFixed(2)}deg`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', reset)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', reset)
    }
  }, [])
  return null
}
