'use client'

import { useEffect, useMemo, useState } from 'react'

import { type Pool, spill } from './spill'
import styles from './ink.module.css'

/**
 * Ink spilled from the top-left corner. It is already there when the page arrives, then
 * spreads very slowly and fades like watercolor drying. A new spill on every load.
 *
 * Each pool is its own pair of layers (crisp + bloom), cropped to the pool and scaled about
 * its own centre. Scaling the whole spill from one origin made the satellites slide away
 * from the corner as they grew; this way every pool stays put and only its edge moves.
 */
export function InkSpill({ className }: { className?: string }) {
  const [seed, setSeed] = useState<number | null>(null)
  const [shown, setShown] = useState(false)
  const s = useMemo(() => (seed === null ? null : spill(seed)), [seed])

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1e6))
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!s) return null

  const layer = (p: Pool, i: number, extra?: React.ReactNode) => {
    // The main pool carries the spray, which reaches about twice its radius.
    const m = p.r * (i === 0 ? 2.2 : 1.8)
    const box = `${p.cx - m} ${p.cy - m} ${m * 2} ${m * 2}`
    const pct = (v: number) => `${(v / s.size) * 100}%`
    return (
      <div
        key={i}
        className={styles.pool}
        style={
          {
            left: pct(p.cx - m),
            top: pct(p.cy - m),
            width: pct(m * 2),
            height: pct(m * 2),
            '--ox': '50%',
            '--oy': '50%',
            // Pools drift out of step with each other, like real drying.
            '--spread': `${46 + i * 7}s`,
          } as React.CSSProperties
        }
      >
        <svg className={styles.bloom} viewBox={box}>
          <path d={p.d} filter="url(#ink-bloom)" fill="url(#ink-spill)" />
        </svg>
        <svg className={styles.crisp} viewBox={box}>
          <path d={p.d} filter="url(#ink-wash)" fill="url(#ink-spill)" />
          {extra}
        </svg>
      </div>
    )
  }

  return (
    <div className={[styles.root, styles.spill, className].filter(Boolean).join(' ')} data-in={shown || undefined} aria-hidden="true">
      {s.pools.map((p, i) =>
        layer(
          p,
          i,
          i === 0 ? (
            <g filter="url(#ink-crisp)" fill="url(#ink-spill)">
              {s.spray.map((d, k) => <path key={k} d={d} />)}
              {s.dots.map((d, k) => <circle key={k} cx={d.x} cy={d.y} r={d.r} />)}
            </g>
          ) : null,
        ),
      )}
    </div>
  )
}
