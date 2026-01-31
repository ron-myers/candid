'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import * as Fathom from 'fathom-client'

export default function FathomAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadAnalytics = () => {
      Fathom.load('YCXMQDZB', {
        includedDomains: ['candid.tools'],
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadAnalytics)
    } else {
      setTimeout(loadAnalytics, 2000)
    }
  }, [])

  useEffect(() => {
    if (pathname) {
      Fathom.trackPageview()
    }
  }, [pathname, searchParams])

  return null
}
