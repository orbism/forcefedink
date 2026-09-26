import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import type { ReactNode } from 'react'

import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { InkDefs } from '@/ink/InkDefs'
import { NavExit } from '@/motion/NavExit'
import { getSiteSettings } from '@/lib/queries'
import '@/styles/tokens.css'
import '@/styles/base.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3100'),
  title: {
    default: 'Force Fed Ink · Christopher Edward Wedemire',
    template: '%s · Force Fed Ink',
  },
  description:
    'Original geometric ink drawings and limited, numbered print drops by Christopher Edward Wedemire.',
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()

  return (
    // Browser extensions inject attributes on <html> before React loads (seen: an inline
    // --oip-* style). This only silences attribute mismatches on this element, not its tree.
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="sr-only">
          Skip to content
        </a>
        <InkDefs />
        <NavExit />
        <Header />
        <main id="main">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  )
}
