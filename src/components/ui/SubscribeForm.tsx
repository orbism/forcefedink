'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { type FormState, subscribe } from '@/lib/actions'

import { buttonStyles } from './EnquiryButton'
import styles from './Form.module.css'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={buttonStyles.btn} disabled={pending}>
      {pending ? '…' : 'Join'}
    </button>
  )
}

/** Drop-notification list. One field, no ceremony. */
export function SubscribeForm({ source }: { source?: string }) {
  const [state, action] = useActionState<FormState, FormData>(subscribe, { ok: false })

  if (state.ok) {
    return (
      <p className={styles.status} data-tone="ok">
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className={styles.form}>
      {source && <input type="hidden" name="source" value={source} />}
      <div className={styles.inline}>
        <label className="sr-only" htmlFor="sub-email">Email</label>
        <input
          id="sub-email"
          name="email"
          type="email"
          className={styles.input}
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          required
          autoComplete="email"
        />
        <Submit />
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
