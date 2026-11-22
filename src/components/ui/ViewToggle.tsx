'use client'

import { useSyncExternalStore } from 'react'

import styles from './ViewToggle.module.css'

const KEY = 'ffi-view'
const VIEWS = [
  { v: 'medium', label: 'Grid', icon: 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z' },
  { v: 'large', label: 'Large grid', icon: 'M2 2h12v12H2z' },
  { v: 'list', label: 'List', icon: 'M2 3h4v4H2zM8 4h6M8 6h4M2 9h4v4H2zM8 10h6M8 12h4' },
] as const
type View = (typeof VIEWS)[number]['v']

const listeners = new Set<() => void>()
const read = (): View => (document.documentElement.dataset.view as View) || 'medium'

// Apply the remembered view as soon as this loads, before the grid hydrates.
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) document.documentElement.dataset.view = saved
  } catch {}
}

function set(v: View) {
  document.documentElement.dataset.view = v
  try {
    localStorage.setItem(KEY, v)
  } catch {}
  listeners.forEach((l) => l())
}

/** Grid (medium thumbs), large grid, or list. Shared by every grid page; remembered. */
export function ViewToggle() {
  const view = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => 'medium' as View,
  )
  return (
    <div className={styles.toggle} role="group" aria-label="View">
      {VIEWS.map(({ v, label, icon }) => (
        <button key={v} type="button" aria-pressed={view === v} aria-label={label} title={label} onClick={() => set(v)}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d={icon} />
          </svg>
        </button>
      ))}
    </div>
  )
}
