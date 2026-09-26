import type { Metadata } from 'next'

import { EnquiryForm } from '@/components/ui/EnquiryForm'
import { Badge } from '@/components/ui/Frame'
import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { getCommissions } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'Commissions',
  description: 'Whether commissions are open, and how to ask about one.',
}

export default async function CommissionsPage() {
  const commissions = await getCommissions()
  const open = Boolean(commissions?.open)

  return (
    <PageStage
      from="left"
      motif="essaouira"
      burst={3}
      head={<StageHead eyebrow="Commissions" title={[open ? 'Open.' : 'Closed for now.']} />}
    >
      <p>
        <Badge tone={open ? 'live' : 'sold'}>{open ? 'Accepting commissions' : 'Not accepting'}</Badge>
      </p>
      {commissions?.blurb && <RichText data={commissions.blurb} />}
      {(open || commissions?.waitlist) && (
        <>
          <h2 className={styles.groupTitle}>{open ? 'Start a conversation' : 'Join the waitlist'}</h2>
          <EnquiryForm defaultType="commission" />
        </>
      )}
    </PageStage>
  )
}
