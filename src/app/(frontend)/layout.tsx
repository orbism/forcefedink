import type { Metadata } from 'next'
import { Cormorant, Marcellus } from 'next/font/google'
import type { ReactNode } from 'react'

import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { InkDefs } from '@/ink/InkDefs'
import { InkTap } from '@/ink/InkTap'
import { Gilt } from '@/motion/Gilt'
import { PageTurn } from '@/motion/PageTurn'
import { getSiteSettings } from '@/lib/queries'
import { siteUrl } from '@/lib/site-url'
import '@/styles/tokens.css'
import '@/styles/base.css'

// Cormorant for display, Marcellus for body and UI. Both get size-matched fallbacks
// (next/font default), so text doesn't shift when the webfont arrives.
const cormorant = Cormorant({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-cormorant',
  display: 'swap',
})

const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Force Fed Ink · Christopher Edward Wedemire',
    template: '%s · Force Fed Ink',
  },
  description:
    'Original geometric ink drawings and limited editions by Christopher Edward Wedemire.',
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()

  return (
    // Browser extensions inject attributes on <html> before React loads (seen: an inline
    // --oip-* style). This only silences attribute mismatches on this element, not its tree.
    <html lang="en" className={`${cormorant.variable} ${marcellus.variable}`} suppressHydrationWarning>
      <head>
        {/* Blur-up images and scroll reveals wait for JavaScript; without it, show everything. */}
        <noscript>
          <style>
            {'img[data-pending],[data-reveal]>*,[data-bleed]>*{opacity:1!important;scale:none!important;translate:none!important;filter:none!important;clip-path:none!important}'}
          </style>
        </noscript>
      </head>
      <body>
        <a href="#main" className="sr-only">
          Skip to content
        </a>
        <InkDefs />
        <PageTurn />
        <InkTap />
        <Gilt />
        <Header />
        <main id="main">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  )
}
