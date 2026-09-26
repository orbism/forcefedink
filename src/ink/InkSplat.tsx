'use client'

import { useEffect, useMemo, useState } from 'react'

import { splat } from './splat'
import styles from './ink.module.css'

type Props = {
  /** Omit for a fresh throw on every load. */
  seed?: number
  /** Size of the throw; 1 is a small accent. */
  scale?: number
  /** Bronze sits under type; gold stands alone. */
  tone?: 'gold' | 'bronze'
  delayMs?: number
  /** Throw direction in radians (0 = right). Omit for any direction. */
  aim?: number
  /** Place the element so its impact point, not its box corner, sits at left/top. */
  anchored?: boolean
  className?: string
}

/**
 * A splash of ink that hits on mount, then bleeds and dries like watercolor.
 *
 * Client-only: the seed is picked on mount so every load throws differently, and the
 * geometry leans on pow/exp/log whose last bits differ between server and browser V8.
 */
export function InkSplat({ seed, scale = 1, tone = 'gold', delayMs = 0, aim, anchored = false, className }: Props) {
  const [actual, setActual] = useState<number | null>(null)
  const [hit, setHit] = useState(false)
  const s = useMemo(() => (actual === null ? null : splat(actual, 640, 360, scale, aim)), [actual, scale, aim])

  useEffect(() => {
    setActual(seed ?? Math.floor(Math.random() * 1e6))
    const t = window.setTimeout(() => setHit(true), delayMs)
    return () => window.clearTimeout(t)
  }, [seed, delayMs])

  if (!s) return null
  const fill = `url(#ink-${tone})`
  const box = `0 0 ${s.width} ${s.height}`
  const vars = {
    '--ox': `${(s.cx / s.width) * 100}%`,
    '--oy': `${(s.cy / s.height) * 100}%`,
    '--cx': `${s.cx.toFixed(1)}px`,
    '--cy': `${s.cy.toFixed(1)}px`,
    ...(anchored ? { translate: `${(-(s.cx / s.width) * 100).toFixed(2)}% ${(-(s.cy / s.height) * 100).toFixed(2)}%` } : {}),
  } as React.CSSProperties

  return (
    <div className={[styles.root, styles.splat, className].filter(Boolean).join(' ')} style={vars} data-hit={hit || undefined} aria-hidden="true">
      <svg className={styles.bloom} viewBox={box}>
        <g filter="url(#ink-bloom)" fill={fill}>
          {s.cores.map((d, i) => <path key={i} d={d} />)}
        </g>
      </svg>
      <svg className={styles.crisp} viewBox={box}>
        <g filter="url(#ink-crisp)" fill={fill}>
          {s.cores.map((d, i) => <path key={i} className={styles.core} d={d} />)}
          {s.streaks.map((st, i) => (
            <path
              key={i}
              className={styles.streak}
              d={st.d}
              style={{ '--sx': `${st.sx.toFixed(1)}px`, '--sy': `${st.sy.toFixed(1)}px`, '--at': `${st.at}ms` } as React.CSSProperties}
            />
          ))}
          {s.specks.map((p, i) => (
            <circle
              key={i}
              className={styles.speck}
              cx={p.x}
              cy={p.y}
              r={p.r}
              style={
                {
                  '--dx': `${((s.cx - p.x) * 0.7).toFixed(1)}px`,
                  '--dy': `${((s.cy - p.y) * 0.7).toFixed(1)}px`,
                  '--at': `${Math.round(p.reach * 120)}ms`,
                  '--fly': `${Math.round(280 + p.reach * 240)}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
