'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { type FormState, submitEnquiry } from '@/lib/actions'

import { buttonStyles } from './EnquiryButton'
import styles from './Form.module.css'

const TYPES = [
  { value: 'print', label: 'A print' },
  { value: 'original', label: 'An original' },
  { value: 'commission', label: 'A commission' },
  { value: 'general', label: 'Something else' },
] as const

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={buttonStyles.btn} disabled={pending}>
      {pending ? 'Sending…' : 'Send'}
    </button>
  )
}

export function EnquiryForm({
  defaultType = 'general',
  defaultSubject,
  challenge,
}: {
  defaultType?: string
  defaultSubject?: string
  /** When present, the answer is required and verified server-side. */
  challenge?: { question: string; token: string } | null
}) {
  const [state, action] = useActionState<FormState, FormData>(submitEnquiry, { ok: false })
  // React clears the form after each action; these restore what was typed.
  const prior = state.values

  if (state.ok) {
    return (
      <p className={styles.status} data-tone="ok">
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className={styles.form}>
      {defaultSubject && <input type="hidden" name="subject" value={defaultSubject} />}

      <div className={styles.field}>
        <label className="label" htmlFor="type">
          About
        </label>
        <select id="type" name="type" className={styles.select} defaultValue={prior?.type || defaultType}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {defaultSubject && t.value === defaultType ? `${t.label} — ${defaultSubject}` : t.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className="label" htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          className={styles.input}
          defaultValue={prior?.name}
          required
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          className={styles.input}
          defaultValue={prior?.email}
          required
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label className="label" htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          className={styles.textarea}
          defaultValue={prior?.message}
          required
          minLength={10}
        />
      </div>

      {challenge && (
        <div className={styles.field}>
          <label className="label" htmlFor="challenge">
            {challenge.question}
          </label>
          <input
            id="challenge"
            name="challengeAnswer"
            className={styles.input}
            required
            autoComplete="off"
            inputMode="numeric"
          />
          <input type="hidden" name="challengeToken" value={challenge.token} />
        </div>
      )}

      <input className={styles.honey} name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {state.error && (
        <p className={styles.status} data-tone="error" role="alert">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  )
}
