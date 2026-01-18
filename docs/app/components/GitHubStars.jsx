'use client'

import { useEffect } from 'react'

export default function GitHubStars({ repo = 'ron-myers/candid' }) {
  useEffect(() => {
    // Load the GitHub buttons script
    const existingScript = document.querySelector('script[src="https://buttons.github.io/buttons.js"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://buttons.github.io/buttons.js'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
  }, [])

  return (
    <a
      className="github-btn"
      href={`https://github.com/${repo}`}
      data-color-scheme="no-preference: light; light: light; dark: dark;"
      data-icon="octicon-star"
      data-size="large"
      data-show-count="true"
      aria-label={`Star ${repo} on GitHub`}
    >
      GitHub Project
    </a>
  )
}
