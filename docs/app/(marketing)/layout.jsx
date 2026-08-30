'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackEvent, EVENTS } from '../components/trackEvent'
import Logo from '../components/Logo'
import GitHubStars from '../components/GitHubStars'

const BANNER_DISMISS_KEY = 'amh-banner-dismissed'

export default function MarketingLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  // Show banner unless previously dismissed (avoids SSR flash)
  useEffect(() => {
    try {
      if (localStorage.getItem(BANNER_DISMISS_KEY) !== '1') {
        setBannerVisible(true)
      }
    } catch {
      setBannerVisible(true)
    }
  }, [])

  const dismissBanner = () => {
    setBannerVisible(false)
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, '1')
    } catch {
      /* localStorage unavailable — dismiss for this session only */
    }
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Close menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [isMenuOpen])

  return (
    <div className="marketing-layout">
      {bannerVisible ? (
        <div className="marketing-banner" role="region" aria-label="Announcement">
          <a
            className="marketing-banner-text"
            href="https://www.actmorehuman.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.ACT_MORE_HUMAN_CLICK)}
          >
            Candid is built by the team at{' '}
            <strong>Act More Human</strong>
            {' — explore our paid services →'}
          </a>
          <button
            className="marketing-banner-close"
            onClick={dismissBanner}
            aria-label="Dismiss announcement"
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
      <header className="marketing-header">
        <nav className="marketing-nav">
          <Link href="/">
            <Logo />
          </Link>

          <button
            className="hamburger-button"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <svg className="hamburger-icon" viewBox="0 0 24 24" fill="none">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>

          <div className={`marketing-nav-links ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
            <Link href="/docs" onClick={closeMenu}>Documentation</Link>
            <GitHubStars />
            <a
              href="https://join.slack.com/t/candid-knc4230/shared_invite/zt-3norwiria-gvg9iQ0Dkg8x43diCcKLrw"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent(EVENTS.SLACK_CLICK)
                closeMenu()
              }}
            >
              Slack
            </a>
          </div>

          {isMenuOpen ? (
            <div
              className="mobile-menu-backdrop"
              onClick={closeMenu}
              aria-hidden="true"
            />
          ) : null}
        </nav>
      </header>
      <main className="marketing-main">
        {children}
      </main>
      <footer className="marketing-footer">
        <p>
          MIT © {new Date().getFullYear()}{' '}·{' '}
          <a
            href="https://www.fritterfactory.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.FRITTER_FACTORY_CLICK)}
          >
            Fritter Factory
          </a>
          {' · '}
          <a
            href="https://www.actmorehuman.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.ACT_MORE_HUMAN_CLICK)}
          >
            Act More Human
          </a>
          {' · '}
          <a
            href="https://www.linkedin.com/company/fritter-factory/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.LINKEDIN_CLICK)}
          >
            LinkedIn
          </a>
          {' · '}
          <Link
            href="/privacy"
            onClick={() => trackEvent(EVENTS.PRIVACY_CLICK)}
          >
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  )
}
