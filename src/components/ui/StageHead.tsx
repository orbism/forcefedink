import { InkSplat } from '@/ink/InkSplat'
import { traceEnd, traceFlood } from '@/motion/timing'
import { TraceTitle } from '@/motion/TraceTitle'
import { TypeIn } from '@/motion/TypeIn'

import styles from './StageHead.module.css'

/** Top-left slot: eyebrow, the traced title with ink thrown beside it, a supporting line. */
export function StageHead({
  eyebrow,
  title,
  detail,
  splash = true,
}: {
  eyebrow?: string
  title: string[]
  detail?: string[]
  /** Off where the page has its own ink statement (Contact's spill). */
  splash?: boolean
}) {
  return (
    <div className={styles.head}>
      {eyebrow && <p className={`label ${styles.eyebrow}`}>{eyebrow}</p>}
      <div className={styles.titleWrap}>
        <TraceTitle lines={title} as="h1" className={styles.title} />
        {/* The ink lands as the last word floods. */}
        {splash && <InkSplat delayMs={traceFlood(title)} className={styles.splat} />}
      </div>
      {detail && <TypeIn lines={detail} as="p" className={styles.detail} speedMs={12} linePauseMs={80} startDelayMs={traceEnd(title)} />}
    </div>
  )
}
