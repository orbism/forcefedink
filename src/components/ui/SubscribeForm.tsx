'use client'

import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

import { type FormState, subscribe } from '@/lib/actions'

import { buttonStyles } from './EnquiryButton'
import styles from './Form.module.css'

function Submit({ className }: { className: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? '…' : 'Sign up'}
    </button>
  )
}

/**
 * New-edition notices. One field, no ceremony. `compact` is the footer's version: field and
 * button joined as one unit that grows when the field is focused and shrinks back after.
 */
export function SubscribeForm({ source, compact = false }: { source?: string; compact?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(subscribe, { ok: false })
  const id = useId()

  if (state.ok) {
    return (
      <p className={styles.status} data-tone="ok">
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className={compact ? styles.notify : styles.form}>
      {source && <input type="hidden" name="source" value={source} />}
      {compact && (
        <label htmlFor={id} className={styles.notifyLabel}>
          Get notified
        </label>
      )}
      <div className={compact ? styles.unit : styles.inline}>
        {!compact && (
          <label className="sr-only" htmlFor={id}>
            Email
          </label>
        )}
        <input
          id={id}
          name="email"
          type="email"
          className={styles.input}
          placeholder={compact ? 'Email' : 'you@example.com'}
          defaultValue={state.values?.email}
          required
          autoComplete="email"
        />
        <Submit className={compact ? styles.unitBtn : buttonStyles.btn} />
      </div>
      <input className={styles.honey} name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state.error && (
        <p className={styles.status} data-tone="error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
