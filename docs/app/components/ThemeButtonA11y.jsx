'use client'
import { useEffect } from 'react'

export default function ThemeButtonA11y() {
  useEffect(() => {
    function patch() {
      const btn = document.querySelector('button[aria-haspopup="listbox"]:not([aria-label])')
      if (btn) {
        btn.setAttribute('aria-label', 'Switch theme')
        observer.disconnect()
      }
    }
    const observer = new MutationObserver(patch)
    observer.observe(document.body, { childList: true, subtree: true })
    patch()
    return () => observer.disconnect()
  }, [])
  return null
}
