'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { trackEvent, EVENTS } from '../components/trackEvent'
import Pre from '../components/Pre'
import SoftwareApplicationSchema from '../components/schema/SoftwareApplicationSchema'
import WorkflowAnimation from '../components/WorkflowAnimation'
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
  const configRef = useRef(null)
  const qaFlowRef = useRef(null)
  const chromeQaCtaRef = useRef(null)
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

    const refs = [featuresRef, howItWorksRef, configRef, qaFlowRef, chromeQaCtaRef, commandsRef, communityRef, faqRef, ctaRef]
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
          The full review → ship → QA → fix loop, in one plugin
        </h1>
        <p
          className="hero-subtitle"
          style={getHeroAnimationStyle(heroLoaded, 200)}
        >
          Candid runs structured code review, ships your branch, QAs the live app in real Chrome, and turns findings into PRs — all from inside Claude Code.
        </p>
        <p
          className="hero-tagline"
          style={getHeroAnimationStyle(heroLoaded, 200)}
        >
          One config. Your standards. Your tone. Your gates.
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
            Get Started in 5 minutes
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
        <div
          className="hero-animation"
          style={getHeroAnimationStyle(heroLoaded, 500)}
          aria-hidden="true"
        >
          <WorkflowAnimation />
        </div>
      </section>

      <section className="demo-section">
        <span className="section-badge">SEE IT IN ACTION</span>
        <h2>What a review actually looks like</h2>
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

        <h3 className="feature-group-heading">Review</h3>
        <div className="card-grid">
          <Link href="/docs/core-features/technical-md" className="card-link">
            <div className="card">
              <h3>Technical.md</h3>
              <p>Write your standards in markdown. <code>/candid-init</code> generates them from your codebase.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/focus-modes" className="card-link">
            <div className="card">
              <h3>Focus Modes</h3>
              <p>Review only what matters: <code>--focus security</code>, <code>performance</code>, <code>architecture</code>, <code>edge-case</code>.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/tone-selection" className="card-link">
            <div className="card">
              <h3>Tone Selection</h3>
              <p><code>--harsh</code> says it straight. <code>--constructive</code> cares but doesn&apos;t soften. Set the default in config.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/re-review" className="card-link">
            <div className="card">
              <h3>Re-Review</h3>
              <p><code>--re-review</code> diffs against your last pass. See what&apos;s fixed, what&apos;s still broken, what&apos;s new.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/decision-register" className="card-link">
            <div className="card">
              <h3>Decision Register</h3>
              <p>Answers persist. The same question never asks twice — across reviews, across sessions.</p>
            </div>
          </Link>
        </div>

        <h3 className="feature-group-heading">Ship</h3>
        <div className="card-grid">
          <Link href="/docs/core-features/auto-commit" className="card-link">
            <div className="card">
              <h3>Auto-Commit</h3>
              <p><code>--auto-commit</code> commits applied fixes with messages that list every change and its severity.</p>
            </div>
          </Link>
          <Link href="/docs/reference/ship-config" className="card-link">
            <div className="card">
              <h3>Configurable Ship Pipeline</h3>
              <p>Install, build, test, review, PR, auto-merge, deploy hook — every step is opt-in via <code>.candid/config.json</code>.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/candid-ship#issue-tracker-integration" className="card-link">
            <div className="card">
              <h3>Linear Integration</h3>
              <p><code>/candid-ship</code> moves the linked Linear issue to <code>In Review</code> on PR open. State, prompt, and team prefixes are yours.</p>
            </div>
          </Link>
        </div>

        <h3 className="feature-group-heading">QA</h3>
        <div className="card-grid">
          <Link href="/docs/core-features/candid-chrome-qa" className="card-link">
            <div className="card">
              <h3>Chrome QA</h3>
              <p><code>/candid-chrome-qa</code> drives real Chrome — desktop and mobile — and writes findings as structured JSON.</p>
            </div>
          </Link>
          <Link href="/docs/core-features/candid-chrome-qa-fix" className="card-link">
            <div className="card">
              <h3>Chrome QA Fix</h3>
              <p>Pick findings to fix. Batched PR, one PR per finding via Conductor, or file Linear issues — your call.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="how-it-works scroll-animate" ref={howItWorksRef}>
        <span className="section-badge">HOW IT WORKS</span>
        <h2>The loop</h2>
        <p className="hero-tagline">
          Install once. Then run the five commands that take a branch from review to shipped.
        </p>
        <ol className="steps-list">
          <li>
            <div className="step-content">
              <strong>Install + init.</strong>
              <span>Add Candid to Claude Code, then generate a <code>Technical.md</code> tuned to your codebase.</span>
              <Pre className="step-code" trackingId="step_install">
                <code>{`npx skills add https://github.com/ron-myers/candid
/candid-init`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Review.</strong>
              <span>Tell Candid <em>what kind</em> of review you want — flags pick tone and focus, freeform text after sets the lens.</span>
              <Pre className="step-code" trackingId="step_review">
                <code>{`/candid-review --harsh review this branch like a
  skeptical CTO — what would block a launch?`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Improve.</strong>
              <span>Where <code>/candid-review</code> asks <em>&quot;what&apos;s wrong or risky?&quot;</em>, this asks <em>&quot;the code works — what would the next version look like if we built it again with what we know now?&quot;</em></span>
              <Pre className="step-code" trackingId="step_improve">
                <code>{`/candid-improve-implementation --focus clarity
  rename anything ambiguous, collapse the helpers
  that are only used once`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Ship.</strong>
              <span>Pipeline runs from <code>.candid/config.json</code>. Add intent for the review pass that gates the PR.</span>
              <Pre className="step-code" trackingId="step_ship">
                <code>{`/candid-ship double-check no secrets, no
  console.logs, no commented-out code before opening PR`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>QA + fix.</strong>
              <span>Drive real Chrome with a goal in plain English. Then pick findings to ship — batched PR, one PR per finding, or Linear issues.</span>
              <Pre className="step-code" trackingId="step_qa">
                <code>{`/candid-chrome-qa --goal "first-time signup flow" \\
  --prompt "where would a new user get stuck?"

/candid-chrome-qa-fix --strategy batched fix the
  P0/P1 blockers, file the rest as Linear issues`}</code>
              </Pre>
            </div>
          </li>
        </ol>
      </section>

      <section className="config-showcase scroll-animate" ref={configRef}>
        <span className="section-badge">CONFIG</span>
        <h2>One config file. Your whole pipeline.</h2>
        <p className="hero-tagline">
          Tone, focus, ship steps, fast-ship toggles, Linear — all in <code>.candid/config.json</code>. No CLI flag hunting.
        </p>
        <div className="config-showcase-grid">
          <Pre className="config-snippet" trackingId="config_showcase">
            <code>{`{
  "tone": "harsh",
  "focus": "security",
  "exclude": ["*.generated.ts"],
  "ship": {
    "installCommand": "pnpm install",
    "buildCommand": "pnpm build",
    "testCommand": "pnpm test",
    "targetBranch": "stable",
    "autoMerge": true,
    "postMergeCommand": "curl -X POST $DEPLOY_HOOK",
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["ENG"],
      "state": "In Review"
    }
  },
  "fastShip": {
    "build": true,
    "autoMerge": true
  }
}`}</code>
          </Pre>
          <ul className="config-annotations">
            <li><code>tone: &quot;harsh&quot;</code> — every <code>/candid-review</code> uses brutal honesty by default.</li>
            <li><code>focus: &quot;security&quot;</code> — reviews target security unless you override per-run.</li>
            <li><code>ship.installCommand</code> — runs before build on every <code>/candid-ship</code>.</li>
            <li><code>ship.autoMerge: true</code> — PR auto-merges once checks pass.</li>
            <li><code>ship.postMergeCommand</code> — deploy webhook fires after merge.</li>
            <li><code>ship.issueTracker.enabled</code> — Linear issue moves to <code>In Review</code> on PR open.</li>
            <li><code>fastShip.build + autoMerge</code> — <code>/candid-fast-ship</code> skips review and tests for trivial PRs.</li>
          </ul>
        </div>
        <Link
          href="/docs/reference/ship-config"
          className="btn-secondary"
          onClick={() => trackEvent(EVENTS.SHIP_CONFIG_CTA_CLICK)}
        >
          See the full ship-config reference <span className="btn-arrow">→</span>
        </Link>
      </section>

      <section className="how-it-works scroll-animate" ref={qaFlowRef}>
        <span className="section-badge">CHROME QA FLOW</span>
        <h2>Find the bug. Fix the bug. Ship the bug fix.</h2>
        <p className="hero-tagline">
          QA your running app, then turn findings into shipped fixes — without leaving Claude Code.
        </p>
        <ol className="steps-list">
          <li>
            <div className="step-content">
              <strong>QA your app — as a frustrated first-time user.</strong>
              <span>Tell Candid <em>who</em> is walking the app. The persona shapes what counts as a finding — confused user, paranoid security engineer, fussy designer.</span>
              <Pre className="step-code" trackingId="qa_step_chrome_qa">
                <code>{`/candid-chrome-qa --goal "signup → first action" \\
  --prompt "walk this as a frustrated first-time user
  who has never seen the product. Where do you bounce?"`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Pick what to fix — as the engineer on call.</strong>
              <span>Filter by severity, category, or persona. Pick the strategy: batched PR, one PR per finding, local-only, or issues-only.</span>
              <Pre className="step-code" trackingId="qa_step_chrome_qa_fix">
                <code>{`/candid-chrome-qa-fix --severity P0,P1 fix the
  blockers like an engineer on call — minimal diffs,
  no refactors, ship fast`}</code>
              </Pre>
            </div>
          </li>
          <li>
            <div className="step-content">
              <strong>Ship it — as the PM filing the backlog.</strong>
              <span>File a Linear issue per finding before touching code, then ship the PRs that link back. Re-runs dedup by ID.</span>
              <Pre className="step-code" trackingId="qa_step_ship">
                <code>{`/candid-chrome-qa-fix --create-issues --strategy batched
  triage like a PM — group related findings, write
  user-facing titles, link back to the QA pass`}</code>
              </Pre>
            </div>
          </li>
        </ol>
      </section>

      <section className="chrome-qa-cta scroll-animate" ref={chromeQaCtaRef}>
        <div className="chrome-qa-cta-inner">
          <div className="chrome-qa-cta-text">
            <span className="section-badge">CHROME QA</span>
            <h2>Parallel agents. Real browser. One command.</h2>
            <p>
              <code>/candid-chrome-qa</code> dispatches independent audit agents across your live app — A11y, layout, copy, performance — all running concurrently in real Chrome. Findings come back as structured JSON, ready for <code>/candid-chrome-qa-fix</code>.
            </p>
            <Pre className="step-code" trackingId="chrome_qa_cta_install">
              <code>{`npx skills add https://github.com/ron-myers/candid`}</code>
            </Pre>
            <Link
              href="/docs/core-features/candid-chrome-qa"
              className="btn-primary"
              onClick={() => trackEvent(EVENTS.CHROME_QA_CTA_CLICK)}
            >
              See how Chrome QA works
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          <div className="chrome-qa-cta-screenshot">
            <Image
              src="/screenshots/candid-chrome-qa-parallel-agents.png"
              alt="Candid Chrome QA dispatching parallel audit agents — A11y, responsive, copy, and performance agents running concurrently"
              width={1628}
              height={440}
              className="chrome-qa-screenshot-image"
            />
          </div>
        </div>
      </section>

      <section className="commands-section scroll-animate" ref={commandsRef}>
        <span className="section-badge">SLASH COMMANDS</span>
        <ul className="commands-list">
          <li>
            <code>/candid-init</code>
            <span>Generate <code>Technical.md</code> + <code>.candid/config.json</code> from your codebase.</span>
          </li>
          <li>
            <code>/candid-review</code>
            <span>Review your changes. Pick tone (<code>--harsh</code>/<code>--constructive</code>) and focus area.</span>
          </li>
          <li>
            <code>/candid-improve</code>
            <span>Refine any output — copy, docs, an answer, a plan — against your goal in a critique→refine loop.</span>
          </li>
          <li>
            <code>/candid-ship</code>
            <span>Run install/build/test, open the PR, optionally auto-merge and update Linear.</span>
          </li>
          <li>
            <code>/candid-fast-ship</code>
            <span>Minimal ship — only steps you opted into in <code>fastShip</code> config run.</span>
          </li>
          <li>
            <code>/candid-chrome-qa</code>
            <span>Walk your running app in real Chrome (desktop + mobile). Filter by route, severity, viewport.</span>
          </li>
          <li>
            <code>/candid-chrome-qa-fix</code>
            <span>Pick findings to fix. Batched PR, one PR per finding via Conductor, or Linear issues only.</span>
          </li>
          <li>
            <code>/candid-validate-standards</code>
            <span>Lint your <code>Technical.md</code> for vague rules and linter overlaps.</span>
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
        <div className="faq-list">
          <div className="faq-item">
            <details>
              <summary>Does Candid work with any language?</summary>
              <p>Any language Claude Code reads. Your Technical.md standards can be language-specific or universal.</p>
            </details>
          </div>
          <div className="faq-item">
            <details>
              <summary>How does Candid pay for Claude Code?</summary>
              <p>It uses whatever Claude Code is already logged into — your API key, Pro, or Max plan. No separate billing.</p>
            </details>
          </div>
          <div className="faq-item">
            <details>
              <summary>Can my team share a config?</summary>
              <p>Commit <code>Technical.md</code> and <code>.candid/config.json</code> to your repo. Every teammate gets the same standards, tone, and ship pipeline automatically.</p>
            </details>
          </div>
          <div className="faq-item">
            <details>
              <summary>Harsh vs. Constructive — what&apos;s the difference?</summary>
              <p>Harsh is brutally honest — best for catching what you&apos;d defend if asked nicely. Constructive is direct but caring, based on Radical Candor principles.</p>
            </details>
          </div>
          <div className="faq-item">
            <details>
              <summary>What is Radical Candor?</summary>
              <p>A management philosophy that combines caring personally with challenging directly. Candid&apos;s constructive tone is based on it.</p>
            </details>
          </div>
          <div className="faq-item">
            <details>
              <summary>What does <code>.candid/config.json</code> control?</summary>
              <p>Tone, focus, file exclusions, the ship pipeline (install/build/test/auto-merge/post-merge hook), fast-ship toggles, and Linear integration. See the <Link href="/docs/reference/ship-config">ship-config reference</Link>.</p>
            </details>
          </div>
        </div>
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
