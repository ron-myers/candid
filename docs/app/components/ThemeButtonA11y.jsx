'use client'
import { useEffect } from 'react'

export default function ThemeButtonA11y() {
  useEffect(() => {
    function patch() {
      document
        .querySelectorAll('button[aria-haspopup="listbox"]:not([aria-label])')
        .forEach(btn => {
          const title = btn.getAttribute('title')
          if (title === 'Change theme') {
            btn.setAttribute('aria-label', 'Switch theme')
          } else {
            btn.setAttribute('aria-label', 'Select copy format')
          }
        })

      document
        .querySelectorAll('nav a[href*="slack.com"]:not([aria-label])')
        .forEach(a => a.setAttribute('aria-label', 'Join Candid on Slack'))
    }

    const observer = new MutationObserver(patch)
    observer.observe(document.body, { childList: true, subtree: true })
    patch()
    return () => observer.disconnect()
  }, [])
  return null
}
