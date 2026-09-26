'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import styles from './Carousel.module.css'

type Slide = { src: string; alt: string }

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * The piece in full, one image at a time. Arrows flank it; beneath, the active slide is a
 * capsule and the others are dots you can click. Arrow keys and swipes work too. With a
 * single image it is just the image.
 */
export function Carousel({ slides, label }: { slides: Slide[]; label: string }) {
  const [index, setIndex] = useState(0)
  const n = slides.length
  const go = useCallback((k: number) => setIndex(((k % n) + n) % n), [n])
  const startX = useRef<number | null>(null)

  useEffect(() => {
    if (n < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n, index, go])

  return (
    <div className={styles.root} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        className={styles.viewport}
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return
          const dx = e.clientX - startX.current
          startX.current = null
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        }}
      >
        <div className={styles.track} style={{ translate: `${-index * 100}% 0` }}>
          {slides.map((s, k) => (
            <div
              key={s.src}
              className={styles.slide}
              aria-hidden={k !== index}
              aria-roledescription="slide"
              aria-label={`${k + 1} of ${n}`}
            >
              <Image src={s.src} alt={s.alt} fill sizes="(min-width: 761px) 50vw, 100vw" priority={k === 0} draggable={false} />
            </div>
          ))}
        </div>
      </div>

      {n > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={() => go(index - 1)} aria-label="Previous image">
            <Chevron dir="left" />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => go(index + 1)} aria-label="Next image">
            <Chevron dir="right" />
          </button>
          <div className={styles.tabs}>
            {slides.map((s, k) => (
              <button
                key={s.src}
                type="button"
                className={styles.tab}
                aria-current={k === index}
                aria-label={`Show image ${k + 1}`}
                onClick={() => go(k)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
