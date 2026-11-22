import type { Metadata } from 'next'

import { BlurImage } from '@/components/ui/BlurImage'
import { RichText } from '@/components/ui/RichText'
import { StageHead } from '@/components/ui/StageHead'
import { pic } from '@/lib/format'
import { getSiteSettings } from '@/lib/queries'
import { PageStage } from '@/motion/PageStage'

import prose from '../prose.module.css'

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'How editions and originals are packed, shipped and delivered.',
}

export default async function ShippingPage() {
  const settings = await getSiteSettings()
  const image = pic('full', settings?.shipping?.image)
  const alt = (typeof settings?.shipping?.image === 'object' && settings.shipping.image?.alt) || 'Packing'

  return (
    <PageStage
      from="right"
      motif="essaouira"
      burst={3}
      head={<StageHead title={['Shipping']} detail={settings?.shippingDisclaimer ? [settings.shippingDisclaimer] : undefined} />}
    >
      {/* A landscape image floats right with the text around it; on narrow sheets it stacks on top. */}
      <div className={prose.wrap}>
        <figure className={`${prose.figure} ${prose.landscape}`}>
          {image ? <BlurImage src={image.src} blur={image.blur} alt={alt} fill sizes="(min-width: 900px) 30rem, 100vw" /> : <span className={prose.placeholder}>Image</span>}
        </figure>
        {settings?.shipping?.body && <RichText data={settings.shipping.body} />}
      </div>
    </PageStage>
  )
}
