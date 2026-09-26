'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { prefersReducedMotion, useInkReveal } from './useInkReveal'
import styles from './TypeIn.module.css'

type Props = {
  /** One entry per line. Lines type in sequence. */
  lines: string[]
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div'
  /** Milliseconds per character. */
  speedMs?: number
  /** Extra pause between lines. */
  linePauseMs?: number
  startDelayMs?: number
  className?: string
}

/**
 * Types text in character by character, with a caret that stops blinking when done.
 *
 * The animated characters are aria-hidden and the real string is exposed once as
 * readable text, so assistive tech gets the sentence rather than a stream of letters.
 */
export function TypeIn({
  lines,
  as: Tag = 'div',
  speedMs = 34,
  linePauseMs = 260,
  startDelayMs = 0,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const state = useInkReveal(ref, { once: true })
  const typing = state === 'drawing' || state === 'held'
  const [done, setDone] = useState(false)

  // Per-character delay, accumulated across lines. Characters are grouped into words so
  // the line can only wrap between words — per-character inline-blocks would otherwise let
  // the browser break mid-word on narrow screens.
  const schedule = useMemo(() => {
    let cursor = startDelayMs
    const out = lines.map((line) => {
      const words = line.split(' ').map((word) =>
        [...word].map((ch) => {
          const delay = cursor
          cursor += speedMs
          return { ch, delay }
        }),
      )
      cursor += linePauseMs
      return words
    })
    return { lines: out, total: cursor }
  }, [lines, speedMs, linePauseMs, startDelayMs])

  useEffect(() => {
    if (!typing) return
    if (prefersReducedMotion()) {
      setDone(true)
      return
    }
    const t = window.setTimeout(() => setDone(true), schedule.total)
    return () => window.clearTimeout(t)
  }, [typing, schedule.total])

  return (
    <div ref={ref}>
      <Tag
        className={[styles.wrap, className].filter(Boolean).join(' ')}
        data-typing={typing || undefined}
        data-done={done || undefined}
      >
        <span className="sr-only">{lines.join(' ')}</span>
        <span aria-hidden="true">
          {schedule.lines.map((words, li) => (
            <span key={li} className={styles.line}>
              {words.map((chars, wi) => (
                <span key={wi}>
                  {wi > 0 && ' '}
                  <span className={styles.word}>
                    {chars.map(({ ch, delay }, ci) => (
                      <span
                        key={ci}
                        className={styles.char}
                        style={{ '--char-delay': `${delay}ms` } as React.CSSProperties}
                      >
                        {ch}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
              {li === schedule.lines.length - 1 && <span className={styles.caret} />}
            </span>
          ))}
        </span>
      </Tag>
    </div>
  )
}
