import { BlurImage } from './BlurImage'
import styles from './Frame.module.css'

export function Frame({
  src,
  alt,
  blur,
  ratio = 1,
  priority = false,
  sizes = '(min-width: 900px) 33vw, 100vw',
}: {
  src: string
  alt: string
  blur?: string | null
  ratio?: number
  priority?: boolean
  sizes?: string
}) {
  return (
    <div className={styles.frame} style={{ '--frame-ratio': String(ratio) } as React.CSSProperties}>
      <BlurImage src={src} alt={alt} blur={blur} fill sizes={sizes} priority={priority} />
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
