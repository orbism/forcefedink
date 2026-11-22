import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EditionCard } from '@/components/shop/EditionCard'
import { BackLink } from '@/components/ui/BackLink'
import { Carousel } from '@/components/ui/Carousel'
import { StageHead } from '@/components/ui/StageHead'
import { editionAvailability, pic, when } from '@/lib/format'
import { getEdition, getEditions, getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import stage from '../../stage.module.css'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const editions = await getEditions()
  return editions.map((d) => ({ slug: String(d.slug) }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const edition = await getEdition(slug)
  if (!edition) return {}
  return { title: edition.title, description: editionAvailability(edition).label }
}

export default async function EditionPage({ params }: Params) {
  const { slug } = await params
  const edition = await getEdition(slug)
  if (!edition) notFound()

  const settings = await getSiteSettings()
  const artwork = edition.artwork

  const images = [
    ...(edition.images ?? []).map((i) => i.image),
    ...(artwork?.images ?? []).map((i) => i.image),
  ]
    .map((m) => pic('full', m))
    .filter((p) => p !== null)

  const details = [
    ['Edition', `${edition.run} prints`],
    ['Paper', edition.paper],
    ['Size', edition.sizes.length ? edition.sizes.map((z) => `${z.label} (${z.run})`).join(', ') : edition.size],
    ['Finishing', [edition.signed && 'Signed', edition.numbered && 'Numbered'].filter(Boolean).join(' · ') || null],
  ].filter(([, v]) => Boolean(v)) as [string, string][]

  return (
    <PageStage
      from="left"
      showcase={<Carousel slides={images.map((p) => ({ ...p, alt: artwork?.title ?? edition.title }))} label={`${edition.title} images`} />}
    >
      <BackLink fallback="/editions" />
      <StageHead eyebrow="Edition" title={[edition.title]} splash={false} />
      {edition.description && <p className={stage.lead}>{edition.description}</p>}

      <EditionCard edition={edition} opens={edition.release ? when(edition.release, true) : null} />

      <h2 className={`${stage.groupTitle} ${stage.tight}`}>Details</h2>
      <dl className={stage.specs}>
        {details.map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <p className={stage.note}>{edition.shipNote || settings?.shippingDisclaimer}</p>
    </PageStage>
  )
}
