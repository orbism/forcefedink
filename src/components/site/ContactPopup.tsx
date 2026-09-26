'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { EnquiryForm } from '@/components/ui/EnquiryForm'
import { newChallenge } from '@/lib/actions'

import styles from './ContactPopup.module.css'

type Challenge = { question: string; token: string }

export function ContactPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // A fresh challenge each time it opens, so a token is never reused.
  useEffect(() => {
    if (!open) {
      setChallenge(null)
      return
    }
    let cancelled = false
    newChallenge().then((c) => {
      if (!cancelled) setChallenge(c)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onKey])

  if (!open) return null

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Contact"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.panel} ref={panelRef} tabIndex={-1}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className={styles.title}>Get in touch</h2>
        <EnquiryForm defaultType="general" challenge={challenge} />
      </div>
    </div>
  )
}
