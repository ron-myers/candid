'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { trackEvent, EVENTS } from '../components/trackEvent'
import Pre from '../components/Pre'
import SoftwareApplicationSchema from '../components/schema/SoftwareApplicationSchema'
import pluginJson from '../../data/plugin.json'

const SCREENSHOTS = [
  {
    src: '/screenshots/candid-review-activation.png',
    alt: 'Candid review command activation showing the review process steps',
    caption: 'Run /candid-review to start a comprehensive code review',
    width: 1200,
    height: 400
  },
  {
    src: '/screenshots/apply-fix-dialog.png',
    alt: 'Apply fix dialog showing individual fix application options',
    caption: 'Review and apply fixes individually with one click',
    width: 1200,
    height: 400
  },
  {
    src: '/screenshots/handle-fixes-options.png',
    alt: 'Fix handling options showing batch operation choices',
    caption: 'Choose how to handle multiple fixes at once',
    width: 1200,
    height: 400
  }
]

// Animation styles - extracted to prevent recreation on every render
const getHeroAnimationStyle = (loaded, delay = 0) => ({
  opacity: loaded ? 1 : 0,
  transform: loaded ? 'translateY(0)' : 'translateY(20px)',
  transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`
})

export default function HomePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState(null)
  const [heroLoaded, setHeroLoaded] = useState(false)

  // Refs for scroll-triggered animations
  const featuresRef = useRef(null)
  const howItWorksRef = useRef(null)
  const qaFlowRef = useRef(null)
  const commandsRef = useRef(null)
  const communityRef = useRef(null)
  const faqRef = useRef(null)
  const ctaRef = useRef(null)

  // Hero load animation
  useEffect(() => {
    setHeroLoaded(true)
  }, [])

  // Scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
          // Also add animate-in to child elements that need it
          const cardGrid = entry.target.querySelector('.card-grid')
          const stepsList = entry.target.querySelector('.steps-list')
          if (cardGrid) cardGrid.classList.add('animate-in')
          if (stepsList) stepsList.classList.add('animate-in')
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    const refs = [featuresRef, howItWorksRef, qaFlowRef, commandsRef, communityRef, faqRef, ctaRef]
    refs.forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => {
      refs.forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current)
        }
      })
    }
  }, [])

  const openLightbox = useCallback((index) => {
    setCurrentImage(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    setCurrentImage(null)
  }, [])

  const navigateImage = useCallback((direction) => {
    if (currentImage === null) return
    const newIndex = (currentImage + direction + SCREENSHOTS.length) % SCREENSHOTS.length
    setCurrentImage(newIndex)
  }, [currentImage])

  return (
    <>
      <SoftwareApplicationSchema />
      <section className="hero">
        <div
          className="version-badge"
          style={getHeroAnimationStyle(heroLoaded, 0)}
        >
          <span className="version-dot"></span>
          v{pluginJson.version} Now Available for Claude Code
        </div>
        <h1
          style={getHeroAnimationStyle(heroLoaded, 100)}
        >
          Code Review for the AI Era
        </h1>
        <p
          className="hero-subtitle"
          style={getHeroAnimationStyle(heroLoaded, 200)}
        >
          Claude Code writes fast. Now you review faster.
        </p>
        <p
          className="hero-tagline"
          style={getHeroAnimationStyle(heroLoaded, 200)}
        >
          And with more confidence.
        </p>
        <div
          className="hero-cta"
          style={getHeroAnimationStyle(heroLoaded, 300)}
        >
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
        <Pre
          className="install-command"
          trackingId="hero_install"
          style={getHeroAnimationStyle(heroLoaded, 400)}
        >
          <code>{`npx skills add https://github.com/ron-myers/candid`}</code>
        </Pre>
      </section>

      <section className="demo-section">
        <span className="section-badge">SEE IT IN ACTION</span>
        <h2>Candid Code Review Workflow</h2>
        <div className="screenshot-grid">
          {SCREENSHOTS.map((screenshot, index) => (
            <div key={index} className="screenshot-item">
              <div
                className="screenshot-wrapper"
                onClick={() => openLightbox(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openLightbox(index)
                  }
                }}
              >
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  width={screenshot.width}
                  height={screenshot.height}
                  className="screenshot-image"
                  priority={index === 0}
                  loading={index === 0 ? undefined : 'lazy'}
                />
                <div className="screenshot-overlay">
                  <svg className="zoom-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M15 15L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <p className="screenshot-caption">{screenshot.caption}</p>
            </div>
          ))}
        </div>
      </section>

      {lightboxOpen && currentImage !== null ? (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeLightbox()
            if (e.key === 'ArrowLeft') navigateImage(-1)
            if (e.key === 'ArrowRight') navigateImage(1)
          }}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="lightbox-nav lightbox-prev"
            onClick={(e) => {
              e.stopPropagation()
              navigateImage(-1)
            }}
            aria-label="Previous image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <Image
              src={SCREENSHOTS[currentImage].src}
              alt={SCREENSHOTS[currentImage].alt}
              width={1600}
              height={900}
              className="lightbox-image"
            />
            <p className="lightbox-caption">{SCREENSHOTS[currentImage].caption}</p>
          </div>
          <button
            className="lightbox-nav lightbox-next"
            onClick={(e) => {
              e.stopPropagation()
              navigateImage(1)
            }}
            aria-label="Next image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : null}

      <section className="features-section scroll-animate" ref={featuresRef}>
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
          <Link href="/docs/core-features/decision-register" className="card-link">
            <div className="card">
              <h3>Decision Register</h3>
              <p>Track questions raised during reviews and their resolutions. Prior answers are reused automatically so the same question is never asked twice.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/candid-ship#issue-tracker-integration" className="card-link">
            <div className="card">
              <h3>Issue Tracker Integration</h3>
              <p>Ship a branch and <code>/candid-ship</code> automatically moves the linked issue (Linear today, more soon) to <code>In Review</code>. Provider, state, and prompt are configurable.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/candid-chrome-qa" className="card-link">
            <div className="card">
              <h3>Chrome QA</h3>
              <p>Drive a real Chrome session with <code>/candid-chrome-qa</code>. Walks your app like a real user across desktop and mobile, writes structured findings JSON for triage.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/candid-chrome-qa-fix" className="card-link">
            <div className="card">
              <h3>Chrome QA Fix</h3>
              <p>Pick which QA findings to fix with <code>/candid-chrome-qa-fix</code>. Batched PR, one PR per finding via Conductor, or file Linear issues — your choice.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="how-it-works scroll-animate" ref={howItWorksRef}>
        <span className="section-badge">HOW IT WORKS</span>
        <ol className="steps-list">
          <li>
            <div className="step-content">
              <strong>Install Candid.</strong>
              <span>Add Candid to Claude Code with two commands from your terminal.</span>
              <Pre className="step-code" trackingId="step_install">
                <code>{`npx skills add https://github.com/ron-myers/candid`}</code>
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

      <section className="how-it-works scroll-animate" ref={qaFlowRef}>
        <span className="section-badge">CHROME QA FLOW</span>
        <h2>From bugs found to bugs fixed</h2>
        <p className="hero-tagline">
          QA your running app, then turn findings into shipped fixes — without leaving Claude Code.
        </p>
        <ol className="steps-list">
          <li>
            <div className="step-content">
              <strong>QA your app.</strong>
              <span>Drive a real Chrome session, walk every target across desktop and mobile, and write structured findings to JSON.</span>
              <Pre className="step-code" trackingId="qa_step_chrome_qa">
                <code>/candid-chrome-qa</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Pick what to fix.</strong>
              <span>Multi-select findings by severity or category. Choose batched PR, parallel PRs via Conductor deep links, local-only, or issues-only.</span>
              <Pre className="step-code" trackingId="qa_step_chrome_qa_fix">
                <code>/candid-chrome-qa-fix</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Ship it — with issues linked.</strong>
              <span>Files one Linear issue per finding before any code change, then opens PRs that link back to the tracker. Re-runs are safe — findings are deduplicated by ID.</span>
              <Pre className="step-code" trackingId="qa_step_ship">
                <code>/candid-chrome-qa-fix --create-issues --strategy batched</code>
              </Pre>
            </div>
          </li>
        </ol>
      </section>

      <section className="commands-section scroll-animate" ref={commandsRef}>
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
            <code>/candid-chrome-qa</code>
            <span>Drive a real Chrome session against your running web app and write structured findings JSON.</span>
          </li>
          <li>
            <code>/candid-chrome-qa-fix</code>
            <span>Pick QA findings to fix and ship them — batched PR, parallel PRs via Conductor, or Linear issues only.</span>
          </li>
          <li>
            <code>/candid-validate-standards</code>
            <span>Check your Technical.md for vague rules and linter overlaps.</span>
          </li>
        </ul>
      </section>

      <section className="community-section scroll-animate" ref={communityRef}>
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

      <section className="faq-section scroll-animate" ref={faqRef}>
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

      <section className="cta-section scroll-animate" ref={ctaRef}>
        <h2>Get started in 5 minutes</h2>
        <Pre className="code-block" trackingId="cta_full_install">
          <code>{`# From a terminal
npx skills add https://github.com/ron-myers/candid

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
