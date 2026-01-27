import { Suspense } from 'react'
import { Head } from 'nextra/components'
import './globals.css'
import FathomAnalytics from './components/FathomAnalytics'
import OrganizationSchema from './components/schema/OrganizationSchema'

export const metadata = {
  metadataBase: new URL('https://www.candid.tools'),

  title: {
    default: 'Candid - Intelligent Code Reviews',
    template: '%s | Candid',
  },
  description: 'Candid is a Claude Code plugin for intelligent, configurable code reviews based on Radical Candor.',

  alternates: {
    canonical: './',
  },

  // OpenGraph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.candid.tools',
    siteName: 'Candid',
    title: 'Candid - Intelligent Code Reviews',
    description: 'Candid is a Claude Code plugin for intelligent, configurable code reviews based on Radical Candor.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Candid - Intelligent Code Reviews for Claude Code',
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Candid - Intelligent Code Reviews',
    description: 'Candid is a Claude Code plugin for intelligent, configurable code reviews based on Radical Candor.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Suspense fallback={null}>
          <FathomAnalytics />
        </Suspense>
        <OrganizationSchema />
        {children}
      </body>
    </html>
  )
}
