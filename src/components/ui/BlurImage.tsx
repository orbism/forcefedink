'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

import styles from './BlurImage.module.css'

/**
 * Blur-up: the stored 16px preview shows at once, blurred; the real image fades and settles
 * in over it when it arrives. Without JavaScript the image simply shows (see layout).
 */
export function BlurImage({ blur, fit = 'cover', className, alt, ...props }: ImageProps & { blur?: string | null; fit?: 'cover' | 'contain' }) {
  const [ready, setReady] = useState(false)
  return (
    <>
      {blur && <span className={styles.lq} data-fit={fit} data-done={ready || undefined} style={{ backgroundImage: `url(${blur})` }} aria-hidden="true" />}
      <Image
        {...props}
        alt={alt}
        className={[styles.img, className].filter(Boolean).join(' ')}
        data-pending={ready ? undefined : ''}
        onLoad={() => setReady(true)}
      />
    </>
  )
}
