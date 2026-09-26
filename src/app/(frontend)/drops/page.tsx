import type { Metadata } from 'next'

import { CardGrid, type CardItem } from '@/components/ui/CardGrid'
import { StageHead } from '@/components/ui/StageHead'
import { asDoc, dropAvailability, mediaUrl, money } from '@/lib/format'
import { getDrops } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'
import type { Artwork, Drop } from '@/payload-types'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Print Drops',
  description: 'Limited, numbered print runs. Once a run closes it does not come back.',
}

const toCard = (drop: Drop): CardItem => {
  const artwork = asDoc<Artwork>(drop.artwork)
  const availability = dropAvailability(drop)
  return {
    href: `/drops/${drop.slug}`,
    title: drop.title,
    image: mediaUrl(drop.images?.[0]?.image, 'card') ?? mediaUrl(artwork?.images?.[0]?.image, 'card'),
    alt: artwork?.title ?? drop.title,
    sub: money(drop.price),
    badge: {
      label: availability.label,
      tone: availability.soldOut ? 'sold' : availability.available ? 'live' : undefined,
    },
  }
}

export default async function DropsPage() {
  const drops = await getDrops()
  const groups: [string, Drop[]][] = [
    ['Open now', drops.filter((d) => d.status === 'live')],
    ['Coming up', drops.filter((d) => d.status === 'upcoming')],
    ['Past drops', drops.filter((d) => d.status === 'soldout' || d.status === 'archived')],
  ]

  return (
    <PageStage
      from="bottom"
      motif="tlemcen"
      head={
        <StageHead
          eyebrow="Print drops"
          title={['Limited runs.', 'Numbered, then gone.']}
          detail={['Fixed editions, signed and numbered.']}
        />
      }
    >
      {drops.length === 0 && <p className={styles.empty}>No drops announced yet.</p>}
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
