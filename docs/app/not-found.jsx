'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from './components/Logo'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)
  const [path, setPath] = useState('')

  useEffect(() => {
    setMounted(true)
    setPath(window.location.pathname)
  }, [])

  return (
    <div className="not-found-layout">
      <header className="not-found-header">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <main className="not-found-main">
        <div className="not-found-content">
          {/* Issue Badge */}
          <div className="not-found-badge">
            <span className="badge-icon">⚠️</span>
            <span className="badge-text">Issue Detected</span>
          </div>

          {/* Large 404 Display */}
          <h1 className="not-found-number">404</h1>

          {/* Tagline & Subtitle */}
          <p className="not-found-tagline">Page Not Found</p>
          <p className="not-found-subtitle">Let's review this situation.</p>

          {/* Review Card */}
          <div className="not-found-review-card">
            <div className="review-card-header">
              <span className="severity-badge">[CRITICAL]</span>
              <span className="severity-title">Missing Resource</span>
            </div>

            <div className="review-card-content">
              <p>
                This page seems to have wandered off. Could be a typo, an outdated link,
                or maybe it's taking a creative break to reconsider its life choices.
              </p>

              {mounted && path && (
                <div className="review-card-location">
                  <span className="location-label">Location:</span>
                  <code className="location-path">{path}</code>
                </div>
              )}

              <p className="review-card-assessment">
                <strong>Assessment:</strong> The requested resource returned a 404. In code review terms,
                this is like calling a function that doesn't exist—technically valid,
                but not very helpful.
              </p>
            </div>
          </div>

          {/* Suggested Fixes */}
          <div className="not-found-actions">
            <h2 className="actions-title">Suggested Fixes</h2>

            <div className="actions-buttons">
              <Link href="/" className="btn-primary">
                Return Home →
              </Link>
              <Link href="/docs" className="btn-secondary">
                Read Documentation →
              </Link>
            </div>

            <p className="actions-footer">
              Still lost? The page you're looking for might have been moved or deleted.
              Check the URL for typos or{' '}
              <a
                href="https://github.com/anthropics/candid/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                report this issue
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
