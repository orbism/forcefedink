import Image from 'next/image'

import styles from './Frame.module.css'

export function Frame({
  src,
  alt,
  ratio = 1,
  priority = false,
  sizes = '(min-width: 900px) 33vw, 100vw',
}: {
  src: string
  alt: string
  ratio?: number
  priority?: boolean
  sizes?: string
}) {
  return (
    <div className={styles.frame} style={{ '--frame-ratio': String(ratio) } as React.CSSProperties}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
    </div>
  )
}

export function Badge({ children, tone }: { children: React.ReactNode; tone?: 'live' | 'sold' }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  )
}

export const frameStyles = styles
