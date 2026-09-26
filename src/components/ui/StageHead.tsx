import { InkSplat } from '@/ink/InkSplat'
import { ENTER_DELAY } from '@/motion/timing'
import { TypeIn } from '@/motion/TypeIn'

import styles from './StageHead.module.css'

const TITLE_SPEED = 30
const TITLE_PAUSE = 160
const TITLE_START = ENTER_DELAY + 80
/** The splash lands just before the last letter does, so the title arrives with a bang. */
const SPLASH_LEAD = 140

/** Top-left slot: eyebrow, the inked title with a splash thrown beside it, a supporting line. */
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
  const chars = title.reduce((n, l) => n + l.length, 0)
  const typed = TITLE_START + chars * TITLE_SPEED + (title.length - 1) * TITLE_PAUSE
  const detailDelay = typed + TITLE_PAUSE

  return (
    <div className={styles.head}>
      {eyebrow && <p className={`label ${styles.eyebrow}`}>{eyebrow}</p>}
      <div className={styles.titleWrap}>
        <TypeIn lines={title} as="h1" className={styles.title} speedMs={TITLE_SPEED} linePauseMs={TITLE_PAUSE} startDelayMs={TITLE_START} />
        {splash && (
          <InkSplat scale={1.3} tone="bronze" aim={0} anchored delayMs={Math.max(ENTER_DELAY, typed - SPLASH_LEAD)} className={styles.splat} />
        )}
      </div>
      {detail && (
        <TypeIn lines={detail} as="p" className={styles.detail} speedMs={12} linePauseMs={80} startDelayMs={detailDelay} />
      )}
    </div>
  )
}
