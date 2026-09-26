import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EnquiryButton } from '@/components/ui/EnquiryButton'
import { Carousel } from '@/components/ui/Carousel'
import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { asDoc, mediaUrl, originalAvailability } from '@/lib/format'
import { getArtwork, getArtworks, getOriginalFor } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import type { Series } from '@/payload-types'

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
    .map((i) => mediaUrl(i.image, 'full'))
    .filter((u): u is string => Boolean(u))

  const facts = [
    ['Year', artwork.year ? String(artwork.year) : null],
    ['Medium', artwork.medium],
    ['Dimensions', artwork.dimensions],
    ['Series', series?.title],
  ].filter(([, v]) => Boolean(v)) as [string, string][]

  return (
    <PageStage
      from="right"
      showcase={<Carousel slides={images.map((src) => ({ src, alt: artwork.title }))} label={`${artwork.title} images`} />}
    >
      <StageHead eyebrow={series?.title ?? 'Original'} title={[artwork.title]} splash={false} />

      <dl className={styles.facts}>
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.original}>
        <p className="label">Original</p>
        {availability ? (
          <>
            <p className={styles.price}>{availability.label}</p>
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
          <p className="label">Process</p>
          <RichText data={artwork.process} />
        </div>
      )}
    </PageStage>
  )
}
