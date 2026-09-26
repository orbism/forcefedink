import type { Metadata } from 'next'

import { EnquiryForm } from '@/components/ui/EnquiryForm'
import { StageHead } from '@/components/ui/StageHead'
import { SubscribeForm } from '@/components/ui/SubscribeForm'
import { InkSpill } from '@/ink/InkSpill'
import { PageStage } from '@/motion/PageStage'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Enquire about a print, an original, or a commission.',
}

const TYPES = ['print', 'original', 'commission', 'general'] as const
type EnquiryType = (typeof TYPES)[number]

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; subject?: string }>
}) {
  const { type, subject } = await searchParams
  const defaultType: EnquiryType = TYPES.includes(type as EnquiryType) ? (type as EnquiryType) : 'general'

  return (
    <PageStage
      from="right"
      motif="ouarzazate"
      backdrop={<InkSpill className={styles.spill} />}
      head={
        <StageHead
          splash={false}
          eyebrow="Contact"
          title={['Get in touch.']}
          detail={subject ? [`About ${subject}.`] : ['Prints, originals, commissions.']}
        />
      }
    >
      <EnquiryForm defaultType={defaultType} defaultSubject={subject} />
      <h2 className={styles.groupTitle}>Drop notifications</h2>
      <SubscribeForm source="contact" />
    </PageStage>
  )
}
