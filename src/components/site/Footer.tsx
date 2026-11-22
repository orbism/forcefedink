'use client'

import Link from 'next/link'
import { useState } from 'react'

import { SubscribeForm } from '@/components/ui/SubscribeForm'

import { ContactPopup } from './ContactPopup'
import { MusicPlayer } from './MusicPlayer'
import styles from './Footer.module.css'

type Settings = {
  socials?: { label: string; href: string }[] | null
  audio?: { url?: string | null; filename?: string | null } | number | null
  audioTitle?: string | null
} | null

const Instagram = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const Mail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5 12 13l8.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function Footer({ settings }: { settings: Settings }) {
  const [contactOpen, setContactOpen] = useState(false)

  const audio = typeof settings?.audio === 'object' ? settings.audio : null
  const instagram =
    settings?.socials?.find((s) => /instagram/i.test(s.label))?.href ??
    'https://instagram.com/forcefedink'

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.left}>
          <SubscribeForm source="footer" compact />
          {audio?.url && <MusicPlayer src={audio.url} title={settings?.audioTitle ?? audio.filename} />}
        </div>

        <div className={styles.right}>
          <Link href="/faq" className={styles.text}>
            FAQ
          </Link>
          <Link href="/shipping" className={styles.text}>
            Shipping
          </Link>
          <a
            className={styles.icon}
            href={instagram}
            target="_blank"
            rel="me noreferrer"
            title="Instagram"
          >
            <Instagram />
            <span className="sr-only">Instagram</span>
          </a>
          <button className={styles.icon} onClick={() => setContactOpen(true)} title="Contact">
            <Mail />
            <span className="sr-only">Contact</span>
          </button>
        </div>
      </footer>

      <ContactPopup open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
