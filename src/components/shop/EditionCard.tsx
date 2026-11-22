'use client'

import { useState } from 'react'

import { EnquiryButton } from '@/components/ui/EnquiryButton'
import { SubscribeForm } from '@/components/ui/SubscribeForm'
import { money } from '@/lib/format'
import type { Edition } from '@/lib/shop'

import { InkMeter } from './InkMeter'
import { Roll } from './Roll'
import styles from './EditionCard.module.css'

/** How long the seal gets before the page turns. */
const SEAL_MS = 520

/**
 * Buying panel for an edition. Each size is its own run with its own count; with one size
 * there is no picker. Upcoming runs show the count to come and take sign-ups; closed runs
 * show the full meter.
 */
export function EditionCard({ edition, opens }: { edition: Edition; opens: string | null }) {
  const sizes = edition.sizes.length
    ? edition.sizes
    : [{ label: edition.size ?? '', run: edition.run, remaining: edition.remaining, price: edition.price }]
  const [k, setK] = useState(0)
  const [sealed, setSealed] = useState(false)
  const s = sizes[k]
  const sold = s.run - s.remaining
  const state = edition.status === 'upcoming' ? 'upcoming' : edition.status === 'live' && s.remaining > 0 ? 'open' : 'closed'

  return (
    <div className={styles.card}>
      {sizes.length > 1 && (
        <div className={styles.sizes} role="group" aria-label="Size">
          {sizes.map((z, i) => (
            <button key={z.label} type="button" aria-pressed={i === k} onClick={() => setK(i)}>
              {z.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.row}>
        <span className={styles.price}>{money(s.price) ?? 'Price on request'}</span>
        <span className={styles.left}>
          {state === 'open' && (
            <>
              <Roll value={s.remaining} /> of {s.run} remaining
            </>
          )}
          {state === 'upcoming' && `Edition of ${s.run}${opens ? ` · opens ${opens}` : ''}`}
          {state === 'closed' && `Edition of ${s.run} · closed`}
        </span>
      </div>

      <InkMeter key={k} run={s.run} sold={state === 'upcoming' ? 0 : state === 'closed' ? s.run : sold} open={state === 'open'} />

      {state === 'open' && (
        // The print's number is stamped beside the button before the page moves on.
        <div className={styles.buy} onClickCapture={() => setSealed(true)}>
          <EnquiryButton
            type="print"
            hold={SEAL_MS}
            subject={[edition.title, sizes.length > 1 ? s.label : null].filter(Boolean).join(', ')}
            label={`Purchase${s.price !== null ? ` · ${money(s.price)}` : ''}`}
          />
          <span className={styles.seal} data-on={sealed || undefined} aria-hidden="true">
            No.{sold + 1}
          </span>
        </div>
      )}
      {state === 'closed' && <EnquiryButton type="print" disabled disabledLabel="Sold out" />}
      {state === 'upcoming' && (
        <div className={styles.notify}>
          <p className="label">Notify me</p>
          <SubscribeForm source={`edition:${edition.slug}`} />
        </div>
      )}
      <p className={styles.note}>{state === 'upcoming' ? 'Subscribers are notified first.' : state === 'closed' ? 'Not reprinted.' : null}</p>
    </div>
  )
}
