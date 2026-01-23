'use client'

import GitHubButton from 'react-github-btn'

export default function GitHubStars({ repo = 'ron-myers/candid' }) {
  return (
    <GitHubButton
      href={`https://github.com/${repo}`}
      data-color-scheme="no-preference: light; light: light; dark: dark;"
      data-size="large"
      data-show-count="true"
      aria-label={`Star ${repo} on GitHub`}
    >
      Star
    </GitHubButton>
  )
}
