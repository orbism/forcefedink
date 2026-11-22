import Link from 'next/link'

import { buttonStyles } from '@/components/ui/EnquiryButton'
import { InkMeter } from '@/components/shop/InkMeter'
import { Countdown } from '@/components/ui/Countdown'
import { SubscribeForm } from '@/components/ui/SubscribeForm'
import { InkSplat } from '@/ink/InkSplat'
import { mediaUrl, money, when } from '@/lib/format'
import { getNextEdition, getPastEditions, getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import { ENTER_DELAY, traceEnd, traceFlood } from '@/motion/timing'
import { TraceTitle } from '@/motion/TraceTitle'
import { TypeIn } from '@/motion/TypeIn'
import type { Edition } from '@/lib/shop'

import stage from './stage.module.css'
import styles from './page.module.css'

const STACK = ['Force', 'Fed', 'Ink']
const STACK_START = ENTER_DELAY + 140

const thumb = (e: Edition) => mediaUrl(e.images?.[0]?.image, 'thumb') ?? mediaUrl(e.artwork?.images?.[0]?.image, 'thumb')

export default async function HomePage() {
  const [next, past, settings] = await Promise.all([getNextEdition(), getPastEditions(), getSiteSettings()])
  const tagline = settings?.hero?.tagline || 'Hand-drawn geometry in ink and gold. Limited editions.'

  return (
    <PageStage
      from="bottom"
      motif="konya"
      burst={6}
      head={
        <div className={styles.brand}>
          <div className={styles.stackWrap}>
            <TraceTitle lines={STACK} as="h1" caps className={styles.stack} startDelayMs={STACK_START} />
            <InkSplat delayMs={traceFlood(STACK, STACK_START)} className={styles.splat} />
          </div>
          <TypeIn lines={[tagline]} as="p" className={styles.tagline} speedMs={16} startDelayMs={traceEnd(STACK, STACK_START)} />
        </div>
      }
    >
      <div className={styles.cols}>
        <section>
          <h2 className={stage.groupTitle}>Next edition</h2>
          {next?.release ? (
            <>
              <Link href={`/editions/${next.slug}`} className={styles.nextTitle}>
                {next.title}
              </Link>
              <Countdown target={next.release} />
              <InkMeter run={next.run} sold={0} open={false} className={styles.meter} />
              <dl className={stage.specs}>
                <div><dt className="label">Opens</dt><dd>{when(next.release, true)}</dd></div>
                <div><dt className="label">Edition</dt><dd>{next.run} prints, signed &amp; numbered</dd></div>
                <div><dt className="label">Price</dt><dd>{money(next.price) ?? 'To be announced'}</dd></div>
                {next.paper && <div><dt className="label">Paper</dt><dd>{next.paper}</dd></div>}
                {(next.sizes.length ? next.sizes.map((s) => s.label).join(', ') : next.size) && (
                  <div><dt className="label">Size</dt><dd>{next.sizes.length ? next.sizes.map((s) => s.label).join(', ') : next.size}</dd></div>
                )}
              </dl>
              {settings?.shippingDisclaimer && <p className={stage.note}>{settings.shippingDisclaimer}</p>}
              <div className={styles.actions}>
                <Link href={`/editions/${next.slug}`} className={`${buttonStyles.btn} ${buttonStyles.ghost}`}>
                  View edition
                </Link>
              </div>
              <h3 className={`${stage.groupTitle} ${stage.tight}`}>Notify me</h3>
              <SubscribeForm source="home" />
            </>
          ) : (
            <p className={styles.empty}>No edition is scheduled. Subscribers hear first.</p>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className={stage.groupTitle}>Past editions</h2>
            <ul className={styles.past}>
              {past.map((d) => {
                const src = thumb(d)
                return (
                  <li key={d.id}>
                    <Link href={`/editions/${d.slug}`} className={`${styles.pastRow} lift`}>
                      {src ? <img src={src} alt="" className={styles.pastThumb} loading="lazy" /> : <span className={styles.pastThumb} />}
                      <span className={styles.pastText}>
                        <span className={styles.pastTitle}>{d.title}</span>
                        <span className={styles.pastMeta}>
                          {d.release ? when(d.release) : '—'} · {d.sold}/{d.run} ·{' '}
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
