import Link from 'next/link'

import { Badge, Frame, frameStyles as s } from './Frame'

export type CardItem = {
  href: string
  title: string
  image: string | null
  alt: string
  sub?: string | null
  badge?: { label: string; tone?: 'live' | 'sold' } | null
}

export function CardGrid({ items, sizes }: { items: CardItem[]; sizes?: string }) {
  return (
    <div className={s.grid}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={s.link}>
          {item.image ? (
            <Frame src={item.image} alt={item.alt} sizes={sizes} />
          ) : (
            <div className={s.frame} />
          )}
          <div className={s.meta}>
            <span className={s.title}>{item.title}</span>
            {item.sub && <span className={s.sub}>{item.sub}</span>}
            {item.badge && <span><Badge tone={item.badge.tone}>{item.badge.label}</Badge></span>}
          </div>
        </Link>
      ))}
    </div>
  )
}
