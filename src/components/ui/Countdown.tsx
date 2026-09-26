'use client'

import { useEffect, useState } from 'react'

import styles from './Countdown.module.css'

const UNITS = [
  ['Days', 86400_000],
  ['Hours', 3600_000],
  ['Minutes', 60_000],
  ['Seconds', 1000],
] as const

function split(ms: number) {
  let rest = Math.max(0, ms)
  return UNITS.map(([name, size]) => {
    const value = Math.floor(rest / size)
    rest -= value * size
    return { name, value }
  })
}

/**
 * Counts down to a drop. Rendered client-side from a fixed target so the server never
 * bakes a stale "time remaining" into the prerendered page.
 */
export function Countdown({ target, label }: { target: string; label?: string }) {
  const targetMs = new Date(target).getTime()
  // Starts null so server and first client render agree; the tick fills it in.
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemaining(targetMs - Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  if (remaining !== null && remaining <= 0) {
    return <p className={styles.live}>The drop is open.</p>
  }

  const parts = split(remaining ?? 0)

  return (
    <div className={styles.wrap}>
      <div className={styles.units}>
        {parts.map((p) => (
          <div key={p.name} className={styles.unit}>
            <span className={styles.value} suppressHydrationWarning>
              {remaining === null ? '––' : String(p.value).padStart(2, '0')}
            </span>
            <span className={styles.name}>{p.name}</span>
          </div>
        ))}
      </div>
      {label && <p className={styles.meta}>{label}</p>}
    </div>
  )
}
