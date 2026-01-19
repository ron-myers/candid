'use client'

import Link from 'next/link'
import { trackEvent, EVENTS } from '../components/trackEvent'
import Pre from '../components/Pre'

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="version-badge">
          <span className="version-dot"></span>
          v1.4.2 Now Available for Claude Code
        </div>
        <h1>Code Review for the AI Era</h1>
        <p className="hero-subtitle">
          Claude Code writes fast. Now you review faster.
        </p>
        <p className="hero-tagline">And with more confidence.</p>
        <div className="hero-cta">
          <Link
            href="/docs"
            className="btn-primary"
            onClick={() => trackEvent(EVENTS.GET_STARTED_CLICK)}
          >
            Get Started
            <svg className="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="/docs/get-started/workflow"
            className="btn-secondary"
            onClick={() => trackEvent(EVENTS.LEARN_MORE_CLICK)}
          >
            Learn how it works <span className="btn-arrow">→</span>
          </Link>
        </div>
        <Pre className="install-command" trackingId="hero_install">
          <code>{`claude plugin marketplace add ron-myers/candid
claude plugin install candid@candid`}</code>
        </Pre>
      </section>

      <section className="features-section">
        <h2>Features</h2>
        <div className="card-grid">
          <Link href="/docs/core-features/technical-md" className="card-link">
            <div className="card">
              <h3>Technical.md</h3>
              <p>Define coding standards in markdown. Run <code>/candid-init</code> to auto-generate from your codebase, or use a template.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/focus-modes" className="card-link">
            <div className="card">
              <h3>Focus Modes</h3>
              <p>Target specific review areas: <code>--focus security</code>, <code>--focus performance</code>, <code>--focus architecture</code>, or <code>--focus edge-case</code>.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/tone-selection" className="card-link">
            <div className="card">
              <h3>Tone Selection</h3>
              <p>Choose <code>--harsh</code> for brutal honesty or <code>--constructive</code> for Radical Candor-style feedback. Set defaults in config.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/re-review" className="card-link">
            <div className="card">
              <h3>Re-Review</h3>
              <p>Run <code>--re-review</code> to compare against your last review. See what's fixed, what's still present, and what's new.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/auto-commit" className="card-link">
            <div className="card">
              <h3>Auto-Commit</h3>
              <p>Add <code>--auto-commit</code> to commit applied fixes with detailed messages listing each fix location and severity.</p>
            </div>
          </Link>
          <Link href="/docs/reference/config-options" className="card-link">
            <div className="card">
              <h3>Config Hierarchy</h3>
              <p>CLI flags override project config (<code>.candid/config.json</code>), which overrides user config (<code>~/.candid/config.json</code>).</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="how-it-works">
        <span className="section-badge">HOW IT WORKS</span>
        <ol className="steps-list">
          <li>
            <div className="step-content">
              <strong>Install Candid.</strong>
              <span>Add Candid to Claude Code with two commands from your terminal.</span>
              <Pre className="step-code" trackingId="step_install">
                <code>{`claude plugin marketplace add ron-myers/candid
claude plugin install candid@candid`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Initialize your Project.</strong>
              <span>Generate a Technical.md for your codebase.</span>
              <Pre className="step-code" trackingId="step_init">
                <code>/candid-init</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Review.</strong>
              <span>Run the command to analyze your changes.</span>
              <Pre className="step-code" trackingId="step_review">
                <code>/candid-review</code>
              </Pre>
            </div>
          </li>
        </ol>
      </section>

      <section className="commands-section">
        <span className="section-badge">SLASH COMMANDS</span>
        <ul className="commands-list">
          <li>
            <code>/candid-review</code>
            <span>Run a code review on your changes with configurable tone and focus areas.</span>
          </li>
          <li>
            <code>/candid-init</code>
            <span>Generate a Technical.md file by analyzing your codebase structure.</span>
          </li>
          <li>
            <code>/candid-validate-standards</code>
            <span>Check your Technical.md for vague rules and linter overlaps.</span>
          </li>
        </ul>
      </section>

      <section className="community-section">
        <span className="section-badge">COMMUNITY</span>
        <h2>Join the Conversation</h2>
        <p>
          Get help, share feedback, and connect with other Candid users.
        </p>
        <a
          href="https://join.slack.com/t/candid-knc4230/shared_invite/zt-3norwiria-gvg9iQ0Dkg8x43diCcKLrw"
          className="btn-primary"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent(EVENTS.SLACK_CLICK)}
        >
          Join our Slack
        </a>
      </section>

      <section className="faq-section">
        <span className="section-badge">FREQUENTLY ASKED QUESTIONS</span>
        <dl className="faq-list">
          <div className="faq-item">
            <dt>Does Candid work with any language?</dt>
            <dd>Yes, Candid reviews code in any language Claude Code supports. Your Technical.md standards can be language-specific or universal.</dd>
          </div>
          <div className="faq-item">
            <dt>How does Candid pay for Claude Code?</dt>
            <dd>Candid uses Claude Code however you're already logged in. If you're using an API key, Candid uses that. If you're on Claude Pro or Max, Candid uses that.</dd>
          </div>
          <div className="faq-item">
            <dt>Can I use Candid with my team?</dt>
            <dd>Yes. Share your Technical.md and candid.config.json in your repo. Everyone gets the same standards and configuration automatically.</dd>
          </div>
          <div className="faq-item">
            <dt>What's the difference between Harsh and Constructive tone?</dt>
            <dd>Harsh mode is brutally honest—great for finding issues you might miss. Constructive mode is caring but direct, based on Radical Candor principles.</dd>
          </div>
          <div className="faq-item">
            <dt>What is Radical Candour?</dt>
            <dd>Radical Candour is a management philosophy that combines caring personally with challenging directly. It's about giving honest, direct feedback while genuinely caring about the person receiving it. Candid's Constructive tone is based on these principles.</dd>
          </div>
        </dl>
      </section>

      <section className="cta-section">
        <h2>Get started in 5 minutes</h2>
        <Pre className="code-block" trackingId="cta_full_install">
          <code>{`# From a terminal
claude plugin marketplace add ron-myers/candid
claude plugin install candid@candid

# start claude (pass any args you normally would)
claude

# init your project
/candid-init

# Run your first review
/candid-review`}</code>
        </Pre>
        <Link
          href="/docs"
          className="btn-primary btn-large"
          onClick={() => trackEvent(EVENTS.DOCS_CTA_CLICK)}
        >
          Read the Documentation →
        </Link>
      </section>
    </>
  )
}
