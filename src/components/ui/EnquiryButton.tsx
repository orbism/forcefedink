import Link from 'next/link'

import styles from './Button.module.css'

/**
 * Checkout is not live yet, so every buy action routes to the enquiry form with the
 * subject already filled in. Swapping this for a cart action later touches one file.
 */
export function EnquiryButton({
  type,
  subject,
  label = 'Enquire to buy',
  disabled = false,
  disabledLabel = 'Unavailable',
  ghost = false,
  hold,
}: {
  type: 'print' | 'original' | 'commission' | 'general'
  subject?: string
  label?: string
  disabled?: boolean
  disabledLabel?: string
  ghost?: boolean
  /** Milliseconds to stay on the page after the click (see PageTurn), e.g. for a seal. */
  hold?: number
}) {
  if (disabled) {
    return (
      <span className={`${styles.btn} ${styles.disabled}`} aria-disabled="true">
        {disabledLabel}
      </span>
    )
  }

  const query = new URLSearchParams({ type, ...(subject ? { subject } : {}) })
  return (
    <Link
      href={`/contact?${query.toString()}`}
      className={`${styles.btn} ${ghost ? styles.ghost : ''}`}
      data-hold={hold}
    >
      {label}
    </Link>
  )
}

export const buttonStyles = styles
