import type { Metadata } from 'next'

import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { getFaqs, getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import type { Faq } from '@/payload-types'

import stage from '../stage.module.css'
import faq from './faq.module.css'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Editions, shipping, originals and commissions.',
}

/** Shipping is its own section (the footer links to it), so it is not a question group. */
const GROUPS = [
  ['prints', 'Prints & editions'],
  ['originals', 'Originals'],
  ['commissions', 'Commissions'],
  ['general', 'General'],
] as const

const Questions = ({ items }: { items: Faq[] }) => (
  <dl className={faq.list}>
    {items.map((f) => (
      <div key={f.id} className={faq.item}>
        <dt className={faq.q}>{f.question}</dt>
        <dd className={faq.a}>
          <RichText data={f.answer} />
        </dd>
      </div>
    ))}
  </dl>
)

const Head = ({ n, title }: { n: number; title: string }) => (
  <h2 className={stage.groupTitle}>
    <span className={faq.num}>{String(n).padStart(2, '0')}</span>
    {title}
  </h2>
)

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSiteSettings()])
  const groups = GROUPS.map(([key, label]) => ({ key, label, items: faqs.filter((f) => f.category === key) })).filter((g) => g.items.length > 0)
  const shipping = faqs.filter((f) => f.category === 'shipping')

  return (
    <PageStage from="bottom" motif="rabat" head={<StageHead title={['FAQ']} />}>
      {groups.map(({ key, label, items }, i) => (
        <section key={key} className={faq.section}>
          <Head n={i + 1} title={label} />
          <Questions items={items} />
        </section>
      ))}
      <section id="shipping" className={faq.section}>
        <Head n={groups.length + 1} title="Shipping" />
        {settings?.shippingDisclaimer && <p className={faq.disclaimer}>{settings.shippingDisclaimer}</p>}
        <Questions items={shipping} />
      </section>
    </PageStage>
  )
}
