'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { type PatternName, pattern } from '@/geometry/patterns'
import { type Rect, onScreen, pathFrom, pick, tilesOf } from '@/geometry/route'

import { prefersReducedMotion } from './useInkReveal'
import styles from './DrawGeometry.module.css'

type Props = {
  name: PatternName
  drawn: boolean
  /** Opening strength: multiplies the pen's starting speed, so more is drawn in the burst. */
  burst?: number
}

/** Field size relative to the corner piece: enough to cover any free area. */
const FIELD = 3.6
/** The field is offset up and right of its container by this much (see CSS), in viewBox units. */
const OFFSET_X = 140
const OFFSET_Y = 100
/**
 * Pen speed in viewBox units per second: v(t) = RHYTHM + (FAST − RHYTHM)·e^(−t/SETTLE).
 * It opens strong, spends about a second slowing, then eases into a steady working rhythm
 * (a shape every few seconds) and holds it. The earlier curve fell to a crawl too abruptly.
 */
const FAST = 9000
const RHYTHM = 180
const SETTLE = 700
/** How strongly the pen prefers the corner over staying next to its last shape — high keeps
 *  the early cluster compact instead of sprawling sideways along a short band. */
const PULL = 0.9
/** Shapes fade with distance from their corner, reaching FAR_OPACITY by FADE_REACH units
 *  (about two corner pieces) — a fixed reach, so the dimming is visible on every page rather
 *  than stretched across however wide the free area happens to be. */
const FAR_OPACITY = 0.14
const FADE_REACH = 1700
/** Each shape gets its own spatial cell's filter, so only the area under the pen repaints. */
const CELL = 400
/** When nothing on screen is left to draw, look again this often (a resize may reveal more). */
const IDLE_MS = 1000

/** Time (ms) to draw `len` units starting `t0` ms into the drawing. */
function travel(t0: number, len: number, burst: number) {
  const dt = 16
  const fast = FAST * burst
  let t = t0
  let d = 0
  while (d < len) {
    d += ((RHYTHM + (fast - RHYTHM) * Math.exp(-t / SETTLE)) * dt) / 1000
    t += dt
  }
  return t - t0
}

/**
 * Gilded strapwork drawn live by a single pen: one complete shape at a time, each adjoining
 * the last, fast at first then slowing to a steady crawl, fading with distance.
 *
 * Every shape is in the DOM from the start, undrawn. The pen chooses each next shape at the
 * moment it needs one, from shapes that are on screen *now* — so it never works off-screen,
 * and resizing only changes what it may reach next: nothing is rebuilt, nothing appears
 * already drawn. Client-only: decorative, and far too many paths for the server HTML.
 */
export function DrawGeometry({ name, drawn, burst = 1 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const rectRef = useRef<Rect | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const field = useMemo(() => {
    if (!mounted) return null
    const g = pattern(name, 1000 * FIELD)
    const { tiles, neighbours } = tilesOf(g.paths, g.dists)
    const cells = new Map<string, number[]>()
    tiles.forEach((t, i) => {
      const [x, y] = t.pts[0]
      const k = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`
      const list = cells.get(k)
      if (list) list.push(i)
      else cells.set(k, [i])
    })
    return { viewBox: g.viewBox, finish: g.finish, tiles, neighbours, cells: [...cells.values()] }
  }, [mounted, name])

  // Visible box in viewBox units, kept current for the pen.
  useEffect(() => {
    const wrap = wrapRef.current
    const fieldEl = fieldRef.current
    if (!wrap || !fieldEl) return
    const measure = () => {
      const unit = fieldEl.getBoundingClientRect().width / (1000 * FIELD)
      if (!unit) return
      const x1 = 1000 - OFFSET_X
      rectRef.current = { x0: x1 - wrap.clientWidth / unit, x1, y0: OFFSET_Y, y1: OFFSET_Y + wrap.clientHeight / unit }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [field])

  // The pen.
  useEffect(() => {
    if (!drawn || !field || !svgRef.current) return
    const { tiles, neighbours } = field
    const groups = [...svgRef.current.querySelectorAll<SVGGElement>('g[data-shape]')]
    const byIndex = new Map(groups.map((g) => [Number(g.dataset.shape), g]))
    const done = new Uint8Array(tiles.length)
    const frontier = new Set<number>()
    let pen: [number, number] = [1000, 0]
    let timer = 0
    const t0 = performance.now()
    const instant = prefersReducedMotion()

    const step = () => {
      const r = rectRef.current
      if (!r) return void (timer = window.setTimeout(step, IDLE_MS))
      const visible = (t: number) => !done[t] && onScreen(tiles[t], r)
      let next = pick(tiles, [...frontier].filter(visible), pen, PULL)
      next ??= pick(tiles, tiles.map((_, i) => i).filter(visible), pen, PULL)
      if (!next) return void (timer = window.setTimeout(step, IDLE_MS))

      const tile = tiles[next.t]
      done[next.t] = 1
      frontier.delete(next.t)
      for (const n of neighbours[next.t]) if (!done[n]) frontier.add(n)

      const g = byIndex.get(next.t)!
      const d = pathFrom(tile, next.entry)
      const dur = instant ? 0 : Math.max(60, Math.round(travel(performance.now() - t0, tile.len, burst)))
      g.setAttribute('opacity', (1 - (1 - FAR_OPACITY) * Math.min(1, tile.dist / FADE_REACH) ** 0.75).toFixed(2))
      g.style.setProperty('--dur', `${dur}ms`)
      for (const p of g.children) p.setAttribute('d', d)
      // Commit the undrawn state for the new path before switching the ink on.
      void g.getBoundingClientRect()
      g.dataset.on = ''

      const pts = tile.pts
      pen = next.entry < pts.length ? pts[next.entry] : pts[0]
      timer = window.setTimeout(step, dur)
    }
    step()
    return () => window.clearTimeout(timer)
  }, [drawn, field, burst])

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div ref={fieldRef} className={styles.field}>
        {field && (
          <svg ref={svgRef} className={styles.svg} viewBox={field.viewBox} aria-hidden="true">
            {field.cells.map((cell, c) => (
              <g key={c} filter="url(#ink-line)">
                {cell.map((i) => {
                  const t = field.tiles[i]
                  return (
                    <g key={i} data-shape={i}>
                      {field.finish.glaze && t.kind === 0 && <path className={styles.glaze} />}
                      {field.finish.interlace && (
                        <path className={`${styles.line} ${styles.ink} ${styles.halo}`} pathLength={1} strokeWidth={9 * t.weight} />
                      )}
                      <path className={`${styles.line} ${styles.ink} ${styles.band} ${styles[t.hue]}`} pathLength={1} strokeWidth={5.5 * t.weight} />
                      <path className={`${styles.line} ${styles.ink} ${styles.channel}`} pathLength={1} strokeWidth={1.8 * t.weight} />
                    </g>
                  )
                })}
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
