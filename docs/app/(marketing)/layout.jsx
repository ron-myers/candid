'use client'

import Link from 'next/link'
import { trackEvent, EVENTS } from '../components/trackEvent'
import Logo from '../components/Logo'
import GitHubStars from '../components/GitHubStars'

export default function MarketingLayout({ children }) {
  return (
    <div className="marketing-layout">
      <header className="marketing-header">
        <nav className="marketing-nav">
          <Link href="/">
            <Logo />
          </Link>
          <div className="marketing-nav-links">
            <Link href="/docs">Documentation</Link>
            <GitHubStars />
            <a
              href="https://join.slack.com/t/candid-knc4230/shared_invite/zt-3norwiria-gvg9iQ0Dkg8x43diCcKLrw"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(EVENTS.SLACK_CLICK)}
            >
              Slack
            </a>
          </div>
        </nav>
      </header>
      <main className="marketing-main">
        {children}
      </main>
      <footer className="marketing-footer">
        <p>
          MIT {new Date().getFullYear()} ©{' '}
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
            href="https://www.linkedin.com/company/fritter-factory/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.LINKEDIN_CLICK)}
          >
            LinkedIn
          </a>
        </p>
      </footer>
    </div>
  )
}
