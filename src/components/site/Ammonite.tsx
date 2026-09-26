import styles from './Ammonite.module.css'

/**
 * The ammonite mark. The source art is a white silhouette on transparent, so it is
 * used as a CSS mask and coloured from tokens — one asset, any colour, no recolouring.
 */
export function Ammonite({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={[styles.mark, className].filter(Boolean).join(' ')}
      style={{ '--mark-size': `${size}px` } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}
