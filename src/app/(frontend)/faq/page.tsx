import type { Metadata } from 'next'

import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { getFaqs, getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import faq from './faq.module.css'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'How print drops, shipping, originals and commissions work.',
}

const GROUPS = [
  ['prints', 'Prints & drops'],
  ['shipping', 'Shipping'],
  ['originals', 'Originals'],
  ['commissions', 'Commissions'],
  ['general', 'General'],
] as const

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSiteSettings()])

  return (
    <PageStage
      from="bottom"
      motif="rabat"
      head={<StageHead eyebrow="FAQ" title={['How this works.']} />}
    >
      <p className={faq.disclaimer}>{settings?.shippingDisclaimer}</p>
      {GROUPS.map(([key, label]) => ({ key, label, items: faqs.filter((f) => f.category === key) }))
        .filter((g) => g.items.length > 0)
        .map(({ key, label, items }, n) => (
          <section key={key} className={faq.section}>
            <header className={faq.sectionHead}>
              <span className={faq.num}>{String(n + 1).padStart(2, '0')}</span>
              <h2 className={faq.sectionTitle}>{label}</h2>
            </header>
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
          </section>
        ))}
    </PageStage>
  )
}
