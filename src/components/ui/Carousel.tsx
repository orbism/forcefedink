'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { BlurImage } from './BlurImage'
import styles from './Carousel.module.css'

type Slide = { src: string; alt: string; blur?: string | null }

/** Loupe magnification over the image as displayed. */
const ZOOM = 2.6
/** Pointer travel (px) under which a press counts as a tap, not a swipe. */
const TAP = 6

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Where a contained image actually sits inside its box. */
function contentRect(img: HTMLImageElement) {
  const box = img.getBoundingClientRect()
  const ratio = img.naturalWidth / img.naturalHeight || 1
  const w = Math.min(box.width, box.height * ratio)
  const h = w / ratio
  return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h }
}

/**
 * The piece in full, one image at a time. Arrows flank it; beneath, the active slide is a
 * capsule and the others are dots. Arrow keys and swipes work too.
 *
 * The work is hairline pen, which disappears at screen size, so the line can be inspected:
 * a loupe follows the mouse, and a click or tap opens the full-resolution image.
 */
export function Carousel({ slides, label }: { slides: Slide[]; label: string }) {
  const [index, setIndex] = useState(0)
  const [full, setFull] = useState<Slide | null>(null)
  const n = slides.length
  const go = useCallback((k: number) => setIndex(((k % n) + n) % n), [n])
  const start = useRef<{ x: number; y: number } | null>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const lens = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') setFull(null)
      if (full || n < 2) return
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n, index, go, full])

  const hideLens = () => lens.current?.removeAttribute('data-on')
  const moveLens = (e: React.PointerEvent) => {
    const l = lens.current
    const img = viewport.current?.querySelector<HTMLImageElement>(`[data-k="${index}"] img`)
    if (e.pointerType !== 'mouse' || !l || !img?.naturalWidth) return
    const r = contentRect(img)
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) return hideLens()
    const v = viewport.current!.getBoundingClientRect()
    const size = l.offsetWidth
    l.style.left = `${e.clientX - v.left}px`
    l.style.top = `${e.clientY - v.top}px`
    l.style.backgroundImage = `url("${slides[index].src}")`
    l.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`
    l.style.backgroundPosition = `${size / 2 - x * ZOOM}px ${size / 2 - y * ZOOM}px`
    l.setAttribute('data-on', '')
  }

  return (
    <div className={styles.root} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={viewport}
        className={styles.viewport}
        onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerMove={moveLens}
        onPointerLeave={hideLens}
        onPointerUp={(e) => {
          if (!start.current) return
          const dx = e.clientX - start.current.x
          const moved = Math.hypot(dx, e.clientY - start.current.y)
          start.current = null
          if (moved < TAP) return setFull(slides[index])
          if (n > 1 && Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        }}
      >
        <div className={styles.track} style={{ translate: `${-index * 100}% 0` }}>
          {slides.map((s, k) => (
            <div
              key={s.src}
              data-k={k}
              className={styles.slide}
              aria-hidden={k !== index}
              aria-roledescription="slide"
              aria-label={`${k + 1} of ${n}`}
            >
              <BlurImage src={s.src} alt={s.alt} blur={s.blur} fit="contain" fill sizes="(min-width: 900px) 50vw, 100vw" priority={k === 0} draggable={false} />
            </div>
          ))}
        </div>
        <div ref={lens} className={styles.lens} aria-hidden="true" />
        <button type="button" className={styles.expand} onClick={() => setFull(slides[index])}>
          View full size
        </button>
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

      {full &&
        createPortal(
          <div className={styles.full} role="dialog" aria-modal="true" aria-label={`${full.alt}, full size`} onClick={() => setFull(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the untouched original, at its own size */}
            <img src={full.src} alt={full.alt} />
            <button type="button" className={styles.close} autoFocus onClick={() => setFull(null)}>
              Close
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
