'use client'

import { useEffect, useRef, useState } from 'react'

import styles from './MusicPlayer.module.css'

type Props = { src: string; title?: string | null }

const Speaker = ({ muted }: { muted: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4z" strokeLinejoin="round" />
    {muted ? (
      <path d="M17 9l4 6M21 9l-4 6" strokeLinecap="round" />
    ) : (
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
    )}
  </svg>
)

/**
 * Footer music player. The mute toggle is always visible; pressing it opens the tray and
 * starts playback. Audio never autoplays — browsers block it, and it is rude besides.
 */
export function MusicPlayer({ src, title }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () =>
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    const onEnd = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    setOpen(true)
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      // Autoplay policy or a missing file — leave the tray open, stay silent.
      setPlaying(false)
    }
  }

  return (
    <div className={styles.player} data-open={open || undefined}>
      <button
        className={styles.toggle}
        onClick={toggle}
        aria-pressed={playing}
        title={playing ? 'Mute' : 'Play'}
      >
        <Speaker muted={!playing} />
        <span className="sr-only">{playing ? 'Mute' : 'Play music'}</span>
      </button>

      <div className={styles.tray} aria-hidden={!open}>
        <span className={styles.title}>{title ?? 'Studio mix'}</span>
        <span className={styles.seek} style={{ '--progress': `${progress}%` } as React.CSSProperties}>
          <span />
        </span>
      </div>

      <audio ref={audioRef} src={src} preload="none" loop />
    </div>
  )
}
