'use client'

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { type PatternName, pattern } from '@/geometry/patterns'

import { DrawGeometry } from './DrawGeometry'
import { ENTER_DELAY } from './timing'
import styles from './PageStage.module.css'

export type SlideFrom = 'bottom' | 'left' | 'right'

type Props = {
  from?: SlideFrom
  /** Which North African construction draws in the corner. */
  motif?: PatternName
  head?: ReactNode
  /** Takes over the free area in place of the head and pattern — detail pages show the piece. */
  showcase?: ReactNode
  /** Surface-level ink beneath everything, e.g. the Contact spill. */
  backdrop?: ReactNode
  children?: ReactNode
  canvasClassName?: string
  /** Resting height of a bottom sheet, e.g. "44dvh". Defaults to half the viewport. */
  sheet?: string
  /** Strength of the geometry's opening burst (1 = standard). */
  burst?: number
}

/** Scroll distance over which the sheet grows to full height. */
const GROW_PX = 320
/** Per-frame easing toward the scroll position: follows closely, never snaps. */
const FOLLOW = 0.16
/** Scroll distance (px) over which the sheet's background pattern draws in completely. */
const PATTERN_PX = 480
/** How far (in accumulated scroll units) the elastic ends can be pulled. */
const STRETCH = 90
/** Delay between blocks that come into view together. */
const REVEAL_STAGGER = 70

/**
 * Scrolling the sheet grows it over the hero. Progress follows scrollTop through a small
 * eased loop and lands in one CSS variable, which only feeds transforms and opacity.
 * Wheel and touch over the hero are forwarded to the sheet, since the document itself
 * never scrolls.
 */
function useSheetScroll(
  stage: React.RefObject<HTMLDivElement | null>,
  scroller: React.RefObject<HTMLDivElement | null>,
  flow: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const st = stage.current
    const sc = scroller.current
    const fl = flow.current
    if (!st || !sc || !fl) return
    let target = 0
    let cur = 0
    let raf = 0
    const tick = () => {
      cur += (target - cur) * FOLLOW
      if (Math.abs(target - cur) < 0.0005) cur = target
      st.style.setProperty('--p', cur.toFixed(4))
      raf = cur === target ? 0 : requestAnimationFrame(tick)
    }
    const onScroll = () => {
      const max = sc.scrollHeight - sc.clientHeight
      target = Math.min(1, sc.scrollTop / (Math.min(GROW_PX, max) || 1))
      // Drawing progress for the pattern behind the content: a short scroll inks most of it.
      st.style.setProperty('--t', Math.min(1, sc.scrollTop / PATTERN_PX).toFixed(4))
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // Elastic ends: pushing past the top or bottom stretches the content like paper, and
    // it springs back (on the Throw curve) once the push stops.
    let over = 0
    let idle = 0
    const release = () => {
      over = 0
      delete fl.dataset.held
      fl.style.translate = ''
    }
    const stretch = (dy: number) => {
      const atTop = sc.scrollTop <= 0
      const atEnd = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1
      if (!over && !((atTop && dy < 0) || (atEnd && dy > 0))) return
      over = Math.max(-STRETCH, Math.min(STRETCH, over - dy * 0.35))
      fl.dataset.held = ''
      fl.style.translate = `0 ${(Math.sign(over) * Math.sqrt(Math.abs(over)) * 6).toFixed(1)}px`
      window.clearTimeout(idle)
      idle = window.setTimeout(release, 140)
    }

    const outside = (e: Event) => !sc.contains(e.target as Node)
    const onWheel = (e: WheelEvent) => {
      if (outside(e)) sc.scrollBy({ top: e.deltaY })
      stretch(e.deltaY)
    }
    let lastY = 0
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      if (outside(e)) sc.scrollBy({ top: lastY - y })
      stretch(lastY - y)
      lastY = y
    }
    sc.addEventListener('scroll', onScroll, { passive: true })
    st.addEventListener('wheel', onWheel, { passive: true })
    st.addEventListener('touchstart', onTouchStart, { passive: true })
    st.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(idle)
      sc.removeEventListener('scroll', onScroll)
      st.removeEventListener('wheel', onWheel)
      st.removeEventListener('touchstart', onTouchStart)
      st.removeEventListener('touchmove', onTouchMove)
    }
  }, [stage, scroller, flow])
}

/**
 * Content arrives as it scrolls into view: each block of the sheet smears in (fade, slide,
 * a brief horizontal blur), cards bleed in like ink. Blocks entering together are staggered.
 * Watches for content that streams in later. Styles in base.css; hidden only once this has
 * run (`data-reveal` is on the server HTML, and the layout's <noscript> undoes it).
 */
function useReveal(flow: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const fl = flow.current
    if (!fl) return
    const io = new IntersectionObserver(
      (entries) => {
        let n = 0
        for (const en of entries) {
          if (!en.isIntersecting) continue
          const el = en.target as HTMLElement
          el.style.setProperty('--rd', `${n++ * REVEAL_STAGGER}ms`)
          el.dataset.in = ''
          io.unobserve(el)
        }
      },
      { threshold: 0.12 },
    )
    const watch = () => {
      for (const el of [...fl.children, ...fl.querySelectorAll('[data-bleed]')]) if (!(el as HTMLElement).dataset.in) io.observe(el)
    }
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(fl, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [flow])
}

/**
 * A very dim copy of the page's construction behind the sheet's content, inked in as the
 * reader scrolls (`--t`, complete by PATTERN_PX) and lifted as they scroll back. Built after
 * mount, straight into the DOM: decorative, and too many paths for the server HTML.
 */
function useSheetPattern(host: React.RefObject<HTMLDivElement | null>, name: PatternName) {
  useEffect(() => {
    const el = host.current
    if (!el) return
    const g = pattern(name, 1000)
    const n = g.paths.length
    const t = document.createElement('template')
    t.innerHTML = `<svg viewBox="${g.viewBox}" preserveAspectRatio="xMaxYMin slice">${g.paths
      .map((p, i) => `<path d="${p.d}" pathLength="1" style="--k:${(i / n).toFixed(4)}"/>`)
      .join('')}</svg>`
    el.replaceChildren(t.content)
    return () => el.replaceChildren()
  }, [host, name])
}

/** Bottom sheets take every pixel the head doesn't need, within these shares of the height
 *  between header and footer: the pattern always keeps a band, content never gets a sliver. */
const SHEET_MIN = 0.4
const SHEET_MAX = 0.8
/** Breathing room between the head's last line and the sheet's edge. */
const HEAD_GAP = 28

/**
 * Sizes a bottom sheet to its page: measures the head and sets --sheet so the hero holds
 * the title and little else, on any screen and in either orientation. Side splits (wide
 * screens) and detail pages keep their CSS sizes.
 */
function useSheetFit(stage: React.RefObject<HTMLDivElement | null>, head: React.RefObject<HTMLDivElement | null>, on: boolean) {
  useEffect(() => {
    const st = stage.current
    const hd = head.current
    if (!on || !st || !hd) return
    const fit = () => {
      const canvas = st.querySelector<HTMLElement>('[data-side]')
      const box = hd.parentElement
      // Only bottom sheets: full-width canvas (a side panel on wide screens is left to CSS).
      if (!canvas || !box || canvas.offsetWidth !== st.clientWidth) return st.style.removeProperty('--sheet')
      // Layout boxes only (offset*), so the sheet's own slide and scroll transforms don't count.
      const floor = canvas.offsetTop + canvas.offsetHeight
      const top = box.offsetTop
      const free = floor - top
      const want = floor - (top + hd.offsetHeight + HEAD_GAP)
      st.style.setProperty('--sheet', `${Math.round(Math.min(free * SHEET_MAX, Math.max(free * SHEET_MIN, want)))}px`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(st)
    ro.observe(hd)
    return () => ro.disconnect()
  }, [stage, head, on])
}

/**
 * A deckled leading edge: one slow, smooth undulation — organic, not ragged. `line` is a
 * calligraphic stroke along it, a ribbon that swells and thins between 1 and 3px.
 * The cross axis maps 1:1 to px (16 units = 16px), so widths are true.
 */
function deckle(seed: number, vertical: boolean) {
  let s = seed
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000)
  const ph = [rand(), rand(), rand(), rand()].map((p) => p * Math.PI * 2)
  const pt = (along: number, across: number) => (vertical ? `${across.toFixed(2)} ${along.toFixed(1)}` : `${along.toFixed(1)} ${across.toFixed(2)}`)
  const mid: string[] = []
  const a: string[] = []
  const b: string[] = []
  for (let i = 0; i <= 200; i++) {
    const t = i / 200
    const depth = 8 + (Math.sin(t * 5 + ph[0]) * 0.8 + Math.sin(t * 11 + ph[1]) * 0.2) * 1.8
    const half = (2 + Math.sin(t * 4 + ph[2]) * 0.7 + Math.sin(t * 9 + ph[3]) * 0.3) / 2
    mid.push(pt(t * 1000, depth))
    a.push(pt(t * 1000, depth - half))
    b.unshift(pt(t * 1000, depth + half))
  }
  return { edge: `M${mid.join('L')}`, line: `M${a.join('L')}L${b.join('L')}Z` }
}

export function PageStage({ from = 'bottom', motif = 'rabat', head, showcase, backdrop, children, canvasClassName, sheet, burst }: Props) {
  const [entered, setEntered] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement>(null)
  const patternRef = useRef<HTMLDivElement>(null)
  useSheetScroll(stageRef, scrollRef, flowRef)
  useReveal(flowRef)
  useSheetPattern(patternRef, motif)
  useSheetFit(stageRef, headRef, !sheet && !showcase && Boolean(head))
  const vertical = from !== 'bottom'
  const edge = useMemo(() => deckle(motif.length * 7919, vertical), [motif, vertical])
  // Side canvases become bottom sheets on phones, which need a horizontal edge instead.
  const flatEdge = useMemo(() => (vertical ? deckle(motif.length * 7919, false) : null), [motif, vertical])

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), ENTER_DELAY)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-entered={entered || undefined}
      data-from={from}
      data-showcase={showcase ? '' : undefined}
      style={sheet ? ({ '--sheet': sheet } as React.CSSProperties) : undefined}
    >
      {backdrop && <div className={styles.backdrop}>{backdrop}</div>}

      {showcase ? (
        <div className={`${styles.topRight} ${styles.showcase}`} data-entered={entered || undefined}>
          {showcase}
        </div>
      ) : (
        <>
          <div className={styles.topRight}>
            <DrawGeometry name={motif} drawn={entered} burst={burst} />
          </div>
          {head && (
            <div className={styles.topLeft}>
              <div ref={headRef} className={styles.headInner}>{head}</div>
            </div>
          )}
        </>
      )}

      {children && (
          <div className={[styles.canvas, canvasClassName].filter(Boolean).join(' ')} data-side={from}>
            <svg
              className={styles.deckle}
              viewBox={vertical ? '0 0 16 1000' : '0 0 1000 16'}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={`${edge.edge}${vertical ? (from === 'left' ? 'L0 1000L0 0Z' : 'L16 1000L16 0Z') : 'L1000 16L0 16Z'}`} className={styles.deckleFill} />
              <path d={edge.line} className={styles.deckleLine} />
            </svg>
            {flatEdge && (
              <svg className={styles.deckleMobile} viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true">
                <path d={`${flatEdge.edge}L1000 16L0 16Z`} className={styles.deckleFill} />
                <path d={flatEdge.line} className={styles.deckleLine} />
              </svg>
            )}
            <div ref={patternRef} className={styles.sheetPattern} aria-hidden="true" />
            <div ref={scrollRef} className={styles.scroll}>
              <div ref={flowRef} className={styles.flow} data-reveal="">
                {children}
              </div>
            </div>
          </div>
      )}
    </div>
  )
}
