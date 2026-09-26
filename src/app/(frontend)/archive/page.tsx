import type { Metadata } from 'next'

import { CardGrid, type CardItem } from '@/components/ui/CardGrid'
import { StageHead } from '@/components/ui/StageHead'
import { mediaUrl } from '@/lib/format'
import { getArtworks, getSeriesList } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Archive',
  description: 'The work, split by series.',
}

export default async function ArchivePage() {
  const [series, artworks] = await Promise.all([getSeriesList(), getArtworks()])
  const seriesOf = (a: (typeof artworks)[number]) =>
    typeof a.series === 'object' ? a.series?.id : a.series

  const items: CardItem[] = series.map((sr) => {
    const inSeries = artworks.filter((a) => seriesOf(a) === sr.id)
    return {
      href: `/archive/${sr.slug}`,
      title: sr.title,
      image: mediaUrl(sr.cover, 'card') ?? mediaUrl(inSeries[0]?.images?.[0]?.image, 'card'),
      alt: sr.title,
      sub: `${inSeries.length} ${inSeries.length === 1 ? 'work' : 'works'}`,
    }
  })

  return (
    <PageStage
      from="right"
      motif="cuenca"
      burst={3}
      head={<StageHead eyebrow="Archive" title={['Geometry,', 'by hand.']} detail={['Split by series.']} />}
    >
      {items.length === 0 ? <p className={styles.empty}>Nothing archived yet.</p> : <CardGrid items={items} sizes="40vw" />}
    </PageStage>
  )
}
