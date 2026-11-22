'use client'

import { useEffect } from 'react'

import { prefersReducedMotion } from '@/motion/useInkReveal'

import { dragInk } from './drag'
import { inkCanvas, renderInk } from './render'
import { scribble } from './scribble'
import styles from './InkTap.module.css'

/** Size of the mark in CSS px (5:3, like every throw). */
const W = 60
const H = 36
const SCALE = 1.5
/** Drip fade-out after it stops, and the mark's own life (match InkTap.module.css). */
const OUT_MS = 240
const MARK_MS = 820

const r = Math.random
const between = (a: number, b: number) => a + r() * (b - a)

/** 1 drip mostly, sometimes 2, now and then 3; no two run the same distance, and some run far. */
function dripLengths() {
  const n = r() < 0.55 ? 1 : r() < 0.67 ? 2 : 3
  const out: number[] = []
  while (out.length < n) {
    const len = r() < 0.18 ? between(90, 260) : between(10, 42)
    if (out.every((l) => Math.abs(l - len) > 8)) out.push(len)
  }
  return out
}

const css = (el: HTMLElement, vars: Record<string, string>) => {
  for (const k in vars) el.style.setProperty(k, vars[k])
}

/**
 * Every click leaves a small gold splash whose drips run straight down like watery ink,
 * the trail fading right behind each head, then gone. Dragging writes a sagging, running
 * line (drag.ts); a free-moving mouse sheds faint, random gold specks. Link clicks also make
 * a short pen scribble. Skipped on form fields, under reduced motion, and for non-primary buttons.
 */
export function InkTap() {
  useEffect(() => {
    const drag = dragInk()
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0 || prefersReducedMotion()) return
      if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return
      const { clientX: x, clientY: y } = e
      if (e.pointerType !== 'touch') drag.down(x, y)
      renderInk({ W: W * SCALE, H: H * SCALE, seed: Math.floor(r() * 1e9), dir: r() * Math.PI * 2, impact: 80, force: 0.12 }).then((res) => {
        const el = document.createElement('div')
        el.className = styles.tap
        el.style.left = `${x - res.cx / SCALE}px`
        el.style.top = `${y - res.cy / SCALE}px`
        el.append(inkCanvas(res.wet, styles.mark))
        let life = MARK_MS
        for (const len of dripLengths()) {
          const t = Math.max(180, (len / between(140, 240)) * 1000)
          const delay = between(20, 110)
          life = Math.max(life, delay + t + OUT_MS)
          const d = document.createElement('i')
          d.className = styles.drip
          d.style.left = `${res.cx / SCALE + (r() - 0.5) * 10}px`
          d.style.top = `${res.cy / SCALE + 1 + r() * 3}px`
          css(d, { '--len': `${len}px`, '--w': `${between(1, 2.2)}px`, '--tail': `${between(6, 16)}px`, '--t': `${t}ms`, '--d': `${delay}ms` })
          el.append(d)
        }
        document.body.append(el)
        window.setTimeout(() => el.remove(), life + 50)
      })
    }

    // Mouse trail: every so often (random distance, random skips) a few faint specks fly off.
    let lx = 0
    let ly = 0
    let travel = 0
    let next = 40
    const onMove = (e: PointerEvent) => {
      if (e.buttons & 1) drag.move(e.clientX, e.clientY)
      if (e.pointerType !== 'mouse') return
      const dx = e.clientX - lx
      const dy = e.clientY - ly
      lx = e.clientX
      ly = e.clientY
      travel += Math.hypot(dx, dy)
      if (travel < next) return
      travel = 0
      next = between(24, 96)
      if (r() < 0.35 || prefersReducedMotion()) return
      const a = Math.atan2(dy, dx)
      for (let i = 0, n = 1 + Math.floor(r() * 3); i < n; i++) {
        const s = document.createElement('i')
        s.className = styles.speck
        s.style.left = `${lx + (r() - 0.5) * 16}px`
        s.style.top = `${ly + (r() - 0.5) * 16}px`
        css(s, { '--s': `${between(0.8, 2.6)}px`, '--o': `${between(0.06, 0.2)}`, '--e': `${r() < 0.25 ? between(2, 3.2) : 1}`, '--a': `${a}rad`, '--t': `${between(700, 1500)}ms` })
        s.addEventListener('animationend', () => s.remove(), { once: true })
        document.body.append(s)
      }
    }

    const onClick = (e: MouseEvent) => {
      if (e.button === 0 && (e.target as Element | null)?.closest?.('a[href]')) scribble()
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('click', onClick, true)
    document.addEventListener('pointerup', drag.up)
    document.addEventListener('pointercancel', drag.up)
    return () => {
      document.removeEventListener('pointerup', drag.up)
      document.removeEventListener('pointercancel', drag.up)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('click', onClick, true)
    }
  }, [])
  return null
}
