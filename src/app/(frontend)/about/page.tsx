import type { Metadata } from 'next'

import { BlurImage } from '@/components/ui/BlurImage'
import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { pic } from '@/lib/format'
import { getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import prose from '../prose.module.css'
import stage from '../stage.module.css'

export const metadata: Metadata = {
  title: 'About',
  description: 'Christopher Edward Wedemire: geometric ink drawings and limited editions.',
}

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const portrait = pic('card', settings?.about?.portrait)

  return (
    <PageStage
      from="left"
      motif="chefchaouen"
      burst={3}
      head={<StageHead eyebrow="About" title={['Christopher', 'Edward Wedemire']} detail={settings?.hero?.tagline ? [settings.hero.tagline] : undefined} />}
    >
      {/* Portrait top left; the bio wraps to its right and runs on beneath it. */}
      {settings?.about?.byline && <p className={`${stage.lead} ${prose.byline}`}>{settings.about.byline}</p>}
      <div className={prose.wrap}>
        <figure className={`${prose.figure} ${prose.portrait}`}>
          {portrait ? <BlurImage src={portrait.src} blur={portrait.blur} alt="Christopher Edward Wedemire" fill sizes="16rem" /> : <span className={prose.placeholder}>Portrait</span>}
        </figure>
        {settings?.about?.bio && <RichText data={settings.about.bio} />}
      </div>
    </PageStage>
  )
}
