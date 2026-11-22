import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/BackLink'
import { EnquiryButton } from '@/components/ui/EnquiryButton'
import { Carousel } from '@/components/ui/Carousel'
import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { asDoc, pic, originalAvailability } from '@/lib/format'
import { getArtwork, getArtworks, getOriginalFor } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import type { Series } from '@/payload-types'

import stage from '../../stage.module.css'
import styles from './artwork.module.css'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const artworks = await getArtworks()
  return artworks.map((a) => ({ slug: String(a.slug) }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const artwork = await getArtwork(slug)
  return artwork
    ? { title: artwork.title, description: [artwork.medium, artwork.dimensions].filter(Boolean).join(', ') }
    : {}
}

export default async function ArtworkPage({ params }: Params) {
  const { slug } = await params
  const artwork = await getArtwork(slug)
  if (!artwork) notFound()

  const original = await getOriginalFor(artwork.id)
  const availability = originalAvailability(original)
  const series = asDoc<Series>(artwork.series)

  const images = (artwork.images ?? [])
    .map((i) => pic('full', i.image))
    .filter((p) => p !== null)

  const facts = [
    ['Year', artwork.year ? String(artwork.year) : null],
    ['Medium', artwork.medium],
    ['Dimensions', artwork.dimensions],
    ['Series', series?.title],
  ].filter(([, v]) => Boolean(v)) as [string, string][]

  return (
    <PageStage
      from="right"
      showcase={<Carousel slides={images.map((p) => ({ ...p, alt: artwork.title }))} label={`${artwork.title} images`} />}
    >
      <BackLink fallback={original ? '/originals' : series?.slug ? `/archive/${series.slug}` : '/archive'} />
      <StageHead eyebrow={series?.title ?? 'Original'} title={[artwork.title]} splash={false} />

      <dl className={stage.specs}>
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h2 className={`${stage.groupTitle} ${stage.tight}`}>Original</h2>
        {availability ? (
          <>
            <p className={styles.price}>{availability.label}</p>
            {original?.description && <p className={stage.lead}>{original.description}</p>}
            <EnquiryButton
              type="original"
              subject={artwork.title}
              label={availability.price ? 'Enquire to buy' : 'Contact about this piece'}
              disabled={!availability.available}
              disabledLabel={availability.label}
            />
          </>
        ) : (
          <p className={styles.muted}>Not listed for sale.</p>
        )}
      </div>

      {artwork.process && (
        <div className={styles.process}>
          <h2 className={`${stage.groupTitle} ${stage.tight}`}>Process</h2>
          <RichText data={artwork.process} />
        </div>
      )}
    </PageStage>
  )
}
