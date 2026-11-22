import type { Metadata } from 'next'

import { card, CardGrid, type CardItem } from '@/components/ui/CardGrid'
import { StageHead } from '@/components/ui/StageHead'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { pic, originalAvailability } from '@/lib/format'
import { getOriginals } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Originals',
  description: 'Original ink drawings by Christopher Edward Wedemire. One of each.',
}

export default async function OriginalsPage() {
  const originals = await getOriginals()
  const items: CardItem[] = originals
    .filter((o) => o.artwork?.slug)
    .map((o) => {
      const a = originalAvailability(o)!
      return {
        href: `/artwork/${o.artwork!.slug}`,
        title: o.artwork!.title ?? o.title,
        ...card(pic('card', o.artwork!.images?.[0]?.image)),
        alt: o.artwork!.title ?? o.title,
        sub: o.dimensions,
        badge: { label: a.label, tone: a.available ? 'live' : 'sold' },
      }
    })

  return (
    <PageStage
      from="left"
      motif="cuenca"
      burst={3}
      head={<StageHead title={['Originals']} detail={['One of each. Ink on paper, signed.']} />}
    >
      <div className={styles.toolbar}>
        <ViewToggle />
      </div>
      {items.length === 0 ? <p className={styles.empty}>No originals are listed.</p> : <CardGrid items={items} sizes="(min-width: 900px) 25vw, 50vw" />}
    </PageStage>
  )
}
