import type { Metadata } from 'next'
import { Suspense } from 'react'

import { EnquiryForm } from '@/components/ui/EnquiryForm'
import { StageHead } from '@/components/ui/StageHead'
import { InkSpill } from '@/ink/InkSpill'
import { PageStage } from '@/motion/PageStage'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Enquire about a print, an original, or a commission.',
}

const TYPES = ['print', 'original', 'commission', 'general'] as const
type EnquiryType = (typeof TYPES)[number]

/** The only part that depends on the query string, so the stage paints first and this
 *  streams in behind it. */
async function Enquiry({ searchParams }: { searchParams: Promise<{ type?: string; subject?: string }> }) {
  const { type, subject } = await searchParams
  const defaultType: EnquiryType = TYPES.includes(type as EnquiryType) ? (type as EnquiryType) : 'general'
  return (
    <>
      {subject && <p className={styles.lede}>About {subject}.</p>}
      <EnquiryForm defaultType={defaultType} defaultSubject={subject} />
    </>
  )
}

export default function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string; subject?: string }> }) {
  return (
    <PageStage
      from="right"
      motif="ouarzazate"
      backdrop={<InkSpill className={styles.spill} />}
      head={<StageHead splash={false} title={['Contact']} detail={['Editions, originals and commissions.']} />}
    >
      <Suspense>
        <Enquiry searchParams={searchParams} />
      </Suspense>
    </PageStage>
  )
}
