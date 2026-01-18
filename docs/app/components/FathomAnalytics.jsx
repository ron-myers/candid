'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import * as Fathom from 'fathom-client'

export default function FathomAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    Fathom.load('YCXMQDZB', {
      includedDomains: ['candid.tools'],
    })
  }, [])

  useEffect(() => {
    if (pathname) {
      Fathom.trackPageview()
    }
  }, [pathname, searchParams])

  return null
}
