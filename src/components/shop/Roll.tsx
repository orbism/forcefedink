'use client'

import { useEffect, useRef } from 'react'

import styles from './Roll.module.css'

/**
 * A number that rolls to its value like an odometer: on arrival it spins up from zero, and
 * any later change rolls from the old value. The server HTML already shows the value.
 */
export function Roll({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const digits = String(value).split('').map(Number)

  useEffect(() => {
    const cols = [...(ref.current?.querySelectorAll<HTMLElement>(`.${styles.col}`) ?? [])]
    // Park every column at 0 without animating, then let the rendered value take over.
    cols.forEach((c) => {
      c.dataset.from = c.style.translate
      c.style.transition = 'none'
      c.style.translate = '0 0'
    })
    void ref.current?.offsetWidth
    cols.forEach((c) => {
      c.style.transition = ''
      c.style.translate = c.dataset.from ?? ''
    })
  }, [])

  return (
    <span ref={ref} className={styles.roll}>
      <span className="sr-only">{value}</span>
      {digits.map((d, i) => (
        <span key={digits.length - i} className={styles.col} style={{ translate: `0 ${-d}em` }} aria-hidden="true">
          {'0123456789'.split('').map((n) => (
            <span key={n}>{n}</span>
          ))}
        </span>
      ))}
    </span>
  )
}
