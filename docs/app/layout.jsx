import { Suspense } from 'react'
import { Head } from 'nextra/components'
import './globals.css'
import FathomAnalytics from './components/FathomAnalytics'

export const metadata = {
  title: {
    default: 'Candid - Intelligent Code Reviews',
    template: '%s | Candid',
  },
  description: 'Candid is a Claude Code plugin for intelligent, configurable code reviews based on Radical Candor.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <Suspense fallback={null}>
          <FathomAnalytics />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
