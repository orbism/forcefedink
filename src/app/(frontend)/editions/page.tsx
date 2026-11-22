import type { Metadata } from 'next'

import { card, CardGrid, type CardItem } from '@/components/ui/CardGrid'
import { StageHead } from '@/components/ui/StageHead'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { editionAvailability, pic, money } from '@/lib/format'
import { getEditions } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import type { Edition } from '@/lib/shop'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Editions',
  description: 'Limited editions. Signed, numbered, never reprinted.',
}

const toCard = (edition: Edition): CardItem => {
  const artwork = edition.artwork
  const availability = editionAvailability(edition)
  return {
    href: `/editions/${edition.slug}`,
    title: edition.title,
    ...card(pic('card', edition.images?.[0]?.image, artwork?.images?.[0]?.image)),
    alt: artwork?.title ?? edition.title,
    sub: edition.sizes.length > 1 && edition.price !== null ? `From ${money(edition.price)}` : money(edition.price),
    badge: {
      label: availability.label,
      tone: availability.soldOut ? 'sold' : availability.available ? 'live' : undefined,
    },
  }
}

export default async function EditionsPage() {
  const editions = await getEditions()
  const groups: [string, Edition[]][] = [
    ['Open', editions.filter((d) => d.status === 'live')],
    ['Upcoming', editions.filter((d) => d.status === 'upcoming')],
    ['Closed', editions.filter((d) => d.status === 'soldout' || d.status === 'archived')],
  ]

  return (
    <PageStage
      from="bottom"
      motif="tlemcen"
      head={
<StageHead title={['Editions']} detail={['Signed, numbered, never reprinted.']} />
      }
    >
      <div className={styles.toolbar}>
        <ViewToggle />
      </div>
      {editions.length === 0 && <p className={styles.empty}>No editions are announced.</p>}
      {groups.map(([label, items]) =>
        items.length ? (
          <section key={label}>
            <h2 className={styles.groupTitle}>{label}</h2>
            <CardGrid items={items.map(toCard)} sizes="(min-width: 900px) 25vw, 50vw" />
          </section>
        ) : null,
      )}
    </PageStage>
  )
}
