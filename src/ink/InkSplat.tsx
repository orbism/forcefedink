'use client'

import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '@/motion/useInkReveal'

import { renderInk } from './render'
import styles from './ink.module.css'

/** Pixel density for the bitmap: soft ink gains nothing past this, and it keeps the render fast. */
const MAX_DPR = 1.5
/** The wet mark spreads out from the impact over this long. */
const HIT_MS = 420
/** How long it stays wet before it starts to dry. */
const WET_MS = 900

/**
 * When the title beside this began animating, on the document timeline. Server-rendered
 * titles start at first paint, well before hydration, so timing from mount would land late.
 */
function titleOrigin(el: HTMLElement) {
  const starts = (el.parentElement?.getAnimations({ subtree: true }) ?? [])
    .map((a) => a.startTime)
    .filter((t): t is number => typeof t === 'number')
  return starts.length ? Math.min(...starts) : null
}

const canvas = (W: number, H: number, className: string) => Object.assign(document.createElement('canvas'), { width: W, height: H, className })

/**
 * A throw of gold-leaf ink beside a title: it lands wet and glossy, spreading from the
 * impact, then dries matte with a pigment ring. Rendered once to a bitmap (fresh on every
 * load); afterwards only opacity moves. The element is placed by its impact point.
 */
export function InkSplat({ delayMs = 0, seed, className }: { delayMs?: number; seed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    let raf = 0
    const timers: number[] = []
    const scale = Math.min(MAX_DPR, window.devicePixelRatio || 1)
    const W = Math.round(el.clientWidth * scale)
    const H = Math.round(el.clientHeight * scale)
    if (!W || !H) return
    const r = Math.random
    const origin = titleOrigin(el) ?? performance.now()

    renderInk({ W, H, seed: seed ?? Math.floor(r() * 1e9), dir: (r() - 0.5) * 0.5, impact: 38, force: 0.62 }).then((res) => {
      if (!alive) return
      el.style.translate = `${(-(res.cx / W) * 100).toFixed(2)}% ${(-(res.cy / H) * 100).toFixed(2)}%`
      const dry = canvas(W, H, styles.dry)
      const wet = canvas(W, H, styles.wet)
      dry.getContext('2d')!.putImageData(res.dry, 0, 0)
      el.append(dry, wet)

      const hit = () => {
        if (prefersReducedMotion()) return void el.setAttribute('data-dry', '')
        const off = canvas(W, H, '')
        off.getContext('2d')!.putImageData(res.wet, 0, 0)
        const ctx = wet.getContext('2d')!
        const reach = Math.hypot(W, H)
        const t0 = performance.now()
        el.setAttribute('data-hit', '')
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / HIT_MS)
          ctx.clearRect(0, 0, W, H)
          ctx.save()
          ctx.beginPath()
          ctx.arc(res.cx, res.cy, Math.max(1, reach * (1 - (1 - t) ** 4)), 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(off, 0, 0)
          ctx.restore()
          if (t < 1) raf = requestAnimationFrame(frame)
          else timers.push(window.setTimeout(() => el.setAttribute('data-dry', ''), WET_MS))
        }
        raf = requestAnimationFrame(frame)
      }
      timers.push(window.setTimeout(hit, prefersReducedMotion() ? 0 : Math.max(0, origin + delayMs - performance.now())))
    })

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      el.replaceChildren()
    }
  }, [delayMs, seed])

  return <div ref={ref} className={[styles.root, styles.splat, className].filter(Boolean).join(' ')} aria-hidden="true" />
}
