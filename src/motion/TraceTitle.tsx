import { TRACE, traceSchedule } from './timing'
import styles from './TraceTitle.module.css'

type Props = {
  /** One entry per line. */
  lines: string[]
  as?: 'h1' | 'h2' | 'p' | 'div'
  className?: string
  startDelayMs?: number
  /** Set uppercase in the markup: SVG text ignores text-transform in some browsers. */
  caps?: boolean
}

/**
 * A title the pen writes: each word's outline is traced, then the ink floods in.
 *
 * Every word is real text (for layout, selection and the dark outline) with an SVG copy laid
 * exactly over it carrying the animated stroke. The copy sits on the word's baseline, which
 * CSS works out from the line height and the display face's metrics, so this needs no
 * JavaScript and renders correctly from the server's HTML. Screen readers get the sentence
 * once; the per-word copies are hidden.
 */
export function TraceTitle({ lines, as: Tag = 'div', className, startDelayMs = TRACE.start, caps = false }: Props) {
  const schedule = traceSchedule(lines, startDelayMs)
  const show = (w: string) => (caps ? w.toUpperCase() : w)
  return (
    <Tag
      className={[styles.wrap, className].filter(Boolean).join(' ')}
      style={{ '--draw': `${TRACE.draw}ms`, '--fill': `${TRACE.fill}ms` } as React.CSSProperties}
    >
      <span className="sr-only">{lines.join(' ')}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => (
          <span key={li} className={styles.line}>
            {line.split(' ').map((word, wi) => (
              <span key={wi}>
                {wi > 0 && ' '}
                <span className={styles.word} style={{ '--d': `${schedule[li][wi]}ms` } as React.CSSProperties}>
                  <span className={styles.ghost}>{show(word)}</span>
                  <svg className={styles.svg}>
                    <text>{show(word)}</text>
                  </svg>
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  )
}
