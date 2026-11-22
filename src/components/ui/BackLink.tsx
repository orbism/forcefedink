import Link from 'next/link'

import styles from './BackLink.module.css'

/**
 * Back to wherever the visitor came from on this site (PageTurn steps back through history
 * for `data-back`); opened cold, it goes to `fallback` instead.
 */
export function BackLink({ fallback }: { fallback: string }) {
  return (
    <Link href={fallback} className={styles.back} data-back="">
      <svg viewBox="0 0 20 10" aria-hidden="true">
        <path d="M19 5H2M6 1 2 5l4 4" />
      </svg>
      Back
    </Link>
  )
}
