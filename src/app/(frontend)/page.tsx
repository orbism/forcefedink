import Link from 'next/link'

import { buttonStyles } from '@/components/ui/EnquiryButton'
import { Countdown } from '@/components/ui/Countdown'
import { SubscribeForm } from '@/components/ui/SubscribeForm'
import { InkSplat } from '@/ink/InkSplat'
import { asDoc, mediaUrl, money } from '@/lib/format'
import { getNextDrop, getPastDrops, getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import { ENTER_DELAY } from '@/motion/timing'
import { TypeIn } from '@/motion/TypeIn'
import type { Artwork, Drop } from '@/payload-types'

import styles from './page.module.css'

const STACK_START = ENTER_DELAY + 140
/** Force / Fed / Ink at 70ms a letter with 90ms between lines. */
const STACK_DONE = STACK_START + 11 * 70 + 2 * 90

/** Server-formatted in a fixed locale and zone, so it can never mismatch on hydration. */
const when = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'UTC',
    weekday: withTime ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' } : {}),
  })

const thumb = (d: Drop) => {
  const art = asDoc<Artwork>(d.artwork)
  return mediaUrl(d.images?.[0]?.image, 'thumb') ?? mediaUrl(art?.images?.[0]?.image, 'thumb')
}

export default async function HomePage() {
  const [next, past, settings] = await Promise.all([getNextDrop(), getPastDrops(), getSiteSettings()])
  const tagline = settings?.hero?.tagline || 'Geometry in gold ink, released in small numbered runs.'

  return (
    <PageStage
      from="bottom"
      motif="konya"
      burst={6}
      sheet="42dvh"
      head={
        <div className={styles.brand}>
          <div className={styles.stackWrap}>
            <TypeIn lines={['Force', 'Fed', 'Ink']} as="h1" className={styles.stack} speedMs={70} linePauseMs={90} startDelayMs={STACK_START} />
            <InkSplat scale={1.3} tone="bronze" aim={0} anchored delayMs={STACK_DONE - 140} className={styles.splat} />
          </div>
          <TypeIn lines={[tagline]} as="p" className={styles.tagline} speedMs={16} startDelayMs={STACK_DONE + 120} />
        </div>
      }
    >
      <div className={styles.cols}>
        <section>
          <p className="label">Next drop</p>
          {next?.released ? (
            <>
              <Link href={`/drops/${next.slug}`} className={styles.nextTitle}>
                {next.title}
              </Link>
              <Countdown target={next.released} />
              <dl className={styles.facts}>
                <div><dt className="label">Opens</dt><dd>{when(next.released, true)}</dd></div>
                <div><dt className="label">Edition</dt><dd>{next.editionSize} prints, signed &amp; numbered</dd></div>
                <div><dt className="label">Price</dt><dd>{money(next.price) ?? 'To be announced'}</dd></div>
                {next.printDetails?.paper && <div><dt className="label">Paper</dt><dd>{next.printDetails.paper}</dd></div>}
                {next.printDetails?.size && <div><dt className="label">Size</dt><dd>{next.printDetails.size}</dd></div>}
              </dl>
              <p className={styles.note}>{settings?.shippingDisclaimer}</p>
              <div className={styles.actions}>
                <Link href={`/drops/${next.slug}`} className={`${buttonStyles.btn} ${buttonStyles.ghost}`}>
                  See the drop
                </Link>
              </div>
              <p className={`label ${styles.notifyLabel}`}>Get told when it opens</p>
              <SubscribeForm source="home" />
            </>
          ) : (
            <p className={styles.empty}>No drop scheduled yet. The mailing list gets told first.</p>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <p className="label">Past drops</p>
            <ul className={styles.past}>
              {past.map((d) => {
                const src = thumb(d)
                return (
                  <li key={d.id}>
                    <Link href={`/drops/${d.slug}`} className={styles.pastRow}>
                      {src ? <img src={src} alt="" className={styles.pastThumb} loading="lazy" /> : <span className={styles.pastThumb} />}
                      <span className={styles.pastText}>
                        <span className={styles.pastTitle}>{d.title}</span>
                        <span className={styles.pastMeta}>
                          {d.released ? when(d.released) : '—'} · {d.editionsSold}/{d.editionSize} ·{' '}
                          {d.status === 'archived' ? 'Archived' : 'Sold out'}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </PageStage>
  )
}
