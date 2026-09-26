import type { Metadata } from 'next'

import { StageHead } from '@/components/ui/StageHead'
import { SubscribeForm } from '@/components/ui/SubscribeForm'
import { getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import styles from '../stage.module.css'

export const metadata: Metadata = {
  title: 'About',
  description: 'Christopher Edward Wedemire — geometric ink drawings and limited print runs.',
}

export default async function AboutPage() {
  const settings = await getSiteSettings()

  return (
    <PageStage
      from="left"
      motif="chefchaouen"
      burst={3}
      head={
        <StageHead
          eyebrow="About"
          title={['Christopher', 'Edward Wedemire']}
          detail={settings?.hero?.tagline ? [settings.hero.tagline] : undefined}
        />
      }
    >
      <p className={styles.lede}>{settings?.hero?.intro}</p>
      <h2 className={styles.groupTitle}>Drop notifications</h2>
      <SubscribeForm source="about" />
    </PageStage>
  )
}
