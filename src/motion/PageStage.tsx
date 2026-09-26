'use client'

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import type { PatternName } from '@/geometry/patterns'

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

/**
 * Scrolling the sheet grows it over the hero. Progress follows scrollTop through a small
 * eased loop and lands in one CSS variable, which only feeds transforms and opacity.
 * Wheel and touch over the hero are forwarded to the sheet, since the document itself
 * never scrolls.
 */
function useSheetScroll(stage: React.RefObject<HTMLDivElement | null>, scroller: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const st = stage.current
    const sc = scroller.current
    if (!st || !sc) return
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
      const range = Math.min(GROW_PX, sc.scrollHeight - sc.clientHeight) || 1
      target = Math.min(1, sc.scrollTop / range)
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const outside = (e: Event) => !sc.contains(e.target as Node)
    const onWheel = (e: WheelEvent) => {
      if (outside(e)) sc.scrollBy({ top: e.deltaY })
    }
    let lastY = 0
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!outside(e)) return
      const y = e.touches[0].clientY
      sc.scrollBy({ top: lastY - y })
      lastY = y
    }
    sc.addEventListener('scroll', onScroll, { passive: true })
    st.addEventListener('wheel', onWheel, { passive: true })
    st.addEventListener('touchstart', onTouchStart, { passive: true })
    st.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      sc.removeEventListener('scroll', onScroll)
      st.removeEventListener('wheel', onWheel)
      st.removeEventListener('touchstart', onTouchStart)
      st.removeEventListener('touchmove', onTouchMove)
    }
  }, [stage, scroller])
}


/** A deckled leading edge: a slow undulation with faint fibre — clean, not ragged. */
function deckle(seed: number, vertical: boolean): string {
  let s = seed
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000)
  const ph = [rand(), rand(), rand()].map((p) => p * Math.PI * 2)
  const pts: string[] = []
  for (let i = 0; i <= 160; i++) {
    const t = i / 160
    const n = Math.sin(t * 9 + ph[0]) * 0.5 + Math.sin(t * 31 + ph[1]) * 0.3 + Math.sin(t * 83 + ph[2]) * 0.12
    const depth = 8 + n * 2.4
    pts.push(vertical ? `${depth.toFixed(1)} ${(t * 1000).toFixed(1)}` : `${(t * 1000).toFixed(1)} ${depth.toFixed(1)}`)
  }
  return `M${pts.join('L')}`
}

export function PageStage({ from = 'bottom', motif = 'fez', head, showcase, backdrop, children, canvasClassName, sheet, burst }: Props) {
  const [entered, setEntered] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  useSheetScroll(stageRef, scrollRef)
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
              <div className={styles.headInner}>{head}</div>
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
              <path d={`${edge}${vertical ? (from === 'left' ? 'L0 1000L0 0Z' : 'L16 1000L16 0Z') : 'L1000 16L0 16Z'}`} className={styles.deckleFill} />
              <path d={edge} className={styles.deckleLine} />
            </svg>
            {flatEdge && (
              <svg className={styles.deckleMobile} viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true">
                <path d={`${flatEdge}L1000 16L0 16Z`} className={styles.deckleFill} />
                <path d={flatEdge} className={styles.deckleLine} />
              </svg>
            )}
            <div ref={scrollRef} className={styles.scroll}>
              {children}
            </div>
          </div>
      )}
    </div>
  )
}
