import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EnquiryButton } from '@/components/ui/EnquiryButton'
import { Carousel } from '@/components/ui/Carousel'
import { Badge } from '@/components/ui/Frame'
import { StageHead } from '@/components/ui/StageHead'
import { asDoc, dropAvailability, mediaUrl, money } from '@/lib/format'
import { getDrop, getDrops, getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import type { Artwork, Drop } from '@/payload-types'

import styles from './drop.module.css'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const drops = await getDrops()
  return drops.map((d) => ({ slug: String(d.slug) }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const drop = await getDrop(slug)
  if (!drop) return {}
  return { title: drop.title, description: dropAvailability(drop as Drop).label }
}

export default async function DropPage({ params }: Params) {
  const { slug } = await params
  const drop = await getDrop(slug)
  if (!drop) notFound()

  const settings = await getSiteSettings()
  const artwork = asDoc<Artwork>(drop.artwork)
  const availability = dropAvailability(drop as Drop)

  const images = [
    ...(drop.images ?? []).map((i) => i.image),
    ...(artwork?.images ?? []).map((i) => i.image),
  ]
    .map((m) => mediaUrl(m, 'full'))
    .filter((u): u is string => Boolean(u))

  const details = [
    ['Edition', `${drop.editionSize} prints`],
    ['Paper', drop.printDetails?.paper],
    ['Size', drop.printDetails?.size],
    [
      'Finishing',
      [drop.printDetails?.signed && 'Signed', drop.printDetails?.numbered && 'Numbered']
        .filter(Boolean)
        .join(' · ') || null,
    ],
  ].filter(([, v]) => Boolean(v)) as [string, string][]

  return (
    <PageStage
      from="left"
      showcase={<Carousel slides={images.map((src) => ({ src, alt: artwork?.title ?? drop.title }))} label={`${drop.title} images`} />}
    >
      <StageHead eyebrow="Print drop" title={[drop.title]} splash={false} />

      <p className={styles.price}>{money(drop.price) ?? 'Contact for price'}</p>
      <p>
        <Badge tone={availability.soldOut ? 'sold' : availability.available ? 'live' : undefined}>{availability.label}</Badge>
      </p>

      <EnquiryButton
        type="print"
        subject={drop.title}
        disabled={!availability.available}
        disabledLabel={availability.soldOut ? 'Sold out' : 'Not yet open'}
      />

      <dl className={styles.details}>
        {details.map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.ship}>{drop.shipNote || settings?.shippingDisclaimer}</p>
    </PageStage>
  )
}
