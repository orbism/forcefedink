import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CardGrid, type CardItem } from '@/components/ui/CardGrid'
import { StageHead } from '@/components/ui/StageHead'
import { mediaUrl } from '@/lib/format'
import { getArtworks, getSeries, getSeriesList } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import styles from '../../stage.module.css'

type Params = { params: Promise<{ series: string }> }

export async function generateStaticParams() {
  const series = await getSeriesList()
  return series.map((sr) => ({ series: String(sr.slug) }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { series } = await params
  const doc = await getSeries(series)
  return doc ? { title: doc.title, description: doc.blurb ?? undefined } : {}
}

export default async function SeriesPage({ params }: Params) {
  const { series } = await params
  const doc = await getSeries(series)
  if (!doc) notFound()

  const artworks = await getArtworks(doc.id)
  const items: CardItem[] = artworks.map((a) => ({
    href: `/artwork/${a.slug}`,
    title: a.title,
    image: mediaUrl(a.images?.[0]?.image, 'card'),
    alt: a.title,
    sub: [a.year, a.medium].filter(Boolean).join(' · ') || null,
  }))

  return (
    <PageStage
      from="bottom"
      motif="meknes"
      head={<StageHead eyebrow="Archive" title={[doc.title]} detail={doc.blurb ? [doc.blurb] : undefined} />}
    >
      {items.length === 0 ? <p className={styles.empty}>Nothing in this series yet.</p> : <CardGrid items={items} sizes="40vw" />}
    </PageStage>
  )
}
