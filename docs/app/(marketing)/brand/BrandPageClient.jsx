'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Brand colors data
const BRAND_COLORS = [
  {
    name: 'Warm Tan',
    variable: '--accent-main',
    hex: { light: '#d4a27f', dark: '#d4a27f' },
    usage: 'Primary brand accent. CTAs, highlights, interactive elements, and brand moments.',
  },
  {
    name: 'Parchment',
    variable: '--bg-light / --bg-dark',
    hex: { light: '#fdfdf7', dark: '#09090b' },
    usage: 'Page backgrounds. Warm cream in light mode, deep charcoal in dark mode.',
  },
  {
    name: 'Canvas',
    variable: '--surface-light / --surface-dark',
    hex: { light: '#f8f7f3', dark: '#111113' },
    usage: 'Elevated surfaces. Cards, code blocks, and interactive containers.',
  },
  {
    name: 'Ink',
    variable: '--text-primary',
    hex: { light: '#1a1612', dark: '#f3f3f3' },
    usage: 'Primary text. Headlines, body copy, and important content.',
  },
  {
    name: 'Graphite',
    variable: '--text-secondary',
    hex: { light: '#5c5850', dark: '#a8a6a0' },
    usage: 'Secondary text. Captions, metadata, and supporting content.',
  },
  {
    name: 'Stroke',
    variable: '--border-light / --border-dark',
    hex: { light: '#e8e6df', dark: '#2a2926' },
    usage: 'Borders and dividers. Subtle visual separation between elements.',
  },
]

// Type scale data
const TYPE_SCALE = [
  { name: 'Hero', size: '4.5rem', px: '72px', variable: '--text-hero', sample: 'Page Headlines' },
  { name: 'Section', size: '3rem', px: '48px', variable: '--text-section', sample: 'Section Titles' },
  { name: 'Card Title', size: '1.5rem', px: '24px', variable: '--text-card-title', sample: 'Card Headers' },
  { name: 'Body', size: '1.125rem', px: '18px', variable: '--text-body', sample: 'Body copy and paragraphs' },
  { name: 'Small', size: '0.875rem', px: '14px', variable: '--text-small', sample: 'Captions and metadata' },
  { name: 'Code', size: '0.875rem', px: '14px', variable: '--text-code', sample: 'npx skills add candid' },
]

// Constants
const TOAST_DURATION_MS = 2000

// Animation styles - extracted to prevent recreation on every render
const getHeroAnimationStyle = (loaded, delay = 0) => ({
  opacity: loaded ? 1 : 0,
  transform: loaded ? 'translateY(0)' : 'translateY(20px)',
  transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`
})

export default function BrandPageClient() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  // Refs for scroll animations
  const logoRef = useRef(null)
  const colorsRef = useRef(null)
  const typographyRef = useRef(null)
  const voiceRef = useRef(null)

  useEffect(() => {
    setHeroLoaded(true)

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
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
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Capture refs at effect execution time to avoid stale refs in cleanup
    const currentRefs = [logoRef, colorsRef, typographyRef, voiceRef]
      .map(ref => ref.current)
      .filter(Boolean)

    currentRefs.forEach(el => observer.observe(el))

    return () => {
      currentRefs.forEach(el => observer.unobserve(el))
    }
  }, [])

  const handleCopy = useCallback(async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      setToastMessage(`Copied ${label}`)
    } catch (err) {
      console.error('Failed to copy:', err)
      setToastMessage('Copy failed - try selecting manually')
    }
    setShowToast(true)
    setTimeout(() => setShowToast(false), TOAST_DURATION_MS)
  }, [])

  const downloadSVG = useCallback((type) => {
    let svgContent = ''
    let filename = ''

    if (type === 'full') {
      svgContent = `<svg viewBox="-2 0 110 32" width="220" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z" fill="white" stroke="#d4a27f" stroke-width="2.5"/>
  <text x="36" y="22" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="500" fill="#1a1612" letter-spacing="-0.5">candid</text>
</svg>`
      filename = 'candid-logo-full.svg'
    } else if (type === 'icon') {
      svgContent = `<svg viewBox="-2 0 34 32" width="68" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z" fill="white" stroke="#d4a27f" stroke-width="2.5"/>
</svg>`
      filename = 'candid-icon.svg'
    } else if (type === 'wordmark') {
      svgContent = `<svg viewBox="0 0 80 28" width="160" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="22" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="500" fill="#1a1612" letter-spacing="-0.5">candid</text>
</svg>`
      filename = 'candid-wordmark.svg'
    }

    try {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToastMessage(`Downloaded ${filename}`)
    } catch (err) {
      console.error('Download failed:', err)
      setToastMessage('Download failed')
    }
    setShowToast(true)
    setTimeout(() => setShowToast(false), TOAST_DURATION_MS)
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="brand-hero">
        <div
          className="brand-hero-badge"
          style={getHeroAnimationStyle(heroLoaded, 0)}
        >
          Brand Guidelines
        </div>
        <h1
          className="brand-hero-wordmark"
          style={getHeroAnimationStyle(heroLoaded, 100)}
        >
          candid
        </h1>
        <p
          className="brand-hero-tagline"
          style={getHeroAnimationStyle(heroLoaded, 200)}
        >
          Code Review for the AI Era
        </p>
        <p
          className="brand-hero-intro"
          style={getHeroAnimationStyle(heroLoaded, 300)}
        >
          Our brand embodies radical honesty in code review. These guidelines ensure
          Candid is represented consistently across all touchpoints.
        </p>
      </section>

      {/* Logo Section */}
      <section className="brand-section scroll-animate" ref={logoRef}>
        <span className="brand-section-label">01</span>
        <h2 className="brand-heading">Logo</h2>
        <p className="brand-subheading">Our mark represents honest conversation</p>

        {/* Primary Logo Display */}
        <div className="brand-logo-display">
          <div className="brand-logo-primary">
            <svg viewBox="-2 0 110 32" width="320" height="93" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z"
                fill="white"
                stroke="#d4a27f"
                strokeWidth="2.5"
              />
              <text
                x="36"
                y="22"
                fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                fontSize="22"
                fontWeight="500"
                fill="currentColor"
                letterSpacing="-0.5"
              >
                candid
              </text>
            </svg>
          </div>
        </div>

        {/* Logo Anatomy */}
        <div className="brand-logo-anatomy">
          <div className="brand-anatomy-item">
            <div className="brand-anatomy-icon">
              <svg viewBox="-2 0 34 32" width="48" height="45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z" fill="white" stroke="#d4a27f" strokeWidth="2.5"/>
              </svg>
            </div>
            <div className="brand-anatomy-content">
              <strong>The Comment Bubble</strong>
              <span>Represents honest dialogue and open communication. The foundation of meaningful code review.</span>
            </div>
          </div>
          <div className="brand-anatomy-item">
            <div className="brand-anatomy-icon">
              <span className="brand-anatomy-wordmark">candid</span>
            </div>
            <div className="brand-anatomy-content">
              <strong>The Wordmark</strong>
              <span>Lowercase, approachable, and direct. Set in Inter Medium for clarity and warmth.</span>
            </div>
          </div>
        </div>

        {/* Logo Variations */}
        <h3 className="brand-subsection-title">Variations</h3>
        <div className="brand-logo-variations">
          <div className="brand-logo-variation">
            <div className="brand-variation-preview">
              <svg viewBox="-2 0 110 32" width="180" height="52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z" fill="white" stroke="#d4a27f" strokeWidth="2.5"/>
                <text x="36" y="22" fontFamily="Inter, -apple-system, sans-serif" fontSize="22" fontWeight="500" fill="currentColor" letterSpacing="-0.5">candid</text>
              </svg>
            </div>
            <span className="brand-variation-label">Full Logo</span>
            <span className="brand-variation-usage">Primary usage</span>
            <button
              className="brand-download-btn"
              onClick={() => downloadSVG('full')}
              aria-label="Download full logo SVG"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              SVG
            </button>
          </div>
          <div className="brand-logo-variation">
            <div className="brand-variation-preview">
              <svg viewBox="-2 0 34 32" width="52" height="49" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z" fill="white" stroke="#d4a27f" strokeWidth="2.5"/>
              </svg>
            </div>
            <span className="brand-variation-label">Icon Only</span>
            <span className="brand-variation-usage">Favicons, small spaces</span>
            <button
              className="brand-download-btn"
              onClick={() => downloadSVG('icon')}
              aria-label="Download icon-only logo SVG"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              SVG
            </button>
          </div>
          <div className="brand-logo-variation">
            <div className="brand-variation-preview">
              <span className="brand-wordmark-only">candid</span>
            </div>
            <span className="brand-variation-label">Wordmark</span>
            <span className="brand-variation-usage">Text-heavy contexts</span>
            <button
              className="brand-download-btn"
              onClick={() => downloadSVG('wordmark')}
              aria-label="Download wordmark SVG"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              SVG
            </button>
          </div>
        </div>

        {/* Logo Do's and Don'ts */}
        <h3 className="brand-subsection-title">Usage Guidelines</h3>
        <div className="brand-dos-donts">
          <div className="brand-guideline brand-guideline--do">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span>Use on light backgrounds with sufficient contrast</span>
          </div>
          <div className="brand-guideline brand-guideline--do">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span>Maintain the original aspect ratio</span>
          </div>
          <div className="brand-guideline brand-guideline--do">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span>Give the logo breathing room (min. icon height on all sides)</span>
          </div>
          <div className="brand-guideline brand-guideline--dont">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span>Don't stretch, skew, or distort</span>
          </div>
          <div className="brand-guideline brand-guideline--dont">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span>Don't add shadows, gradients, or effects</span>
          </div>
          <div className="brand-guideline brand-guideline--dont">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span>Don't change the brand colors</span>
          </div>
        </div>
      </section>

      {/* Color Section */}
      <section className="brand-section scroll-animate" ref={colorsRef}>
        <span className="brand-section-label">02</span>
        <h2 className="brand-heading">Color</h2>
        <p className="brand-subheading">A warm, sophisticated palette inspired by honest conversation</p>

        <div className="brand-color-mode-indicator">
          Currently viewing: <strong>{isDark ? 'Dark Mode' : 'Light Mode'}</strong>
        </div>

        <div className="brand-color-grid">
          {BRAND_COLORS.map((color, index) => (
            <div
              key={index}
              className="brand-color-swatch"
              onClick={() => handleCopy(isDark ? color.hex.dark : color.hex.light, color.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCopy(isDark ? color.hex.dark : color.hex.light, color.name)
                }
              }}
            >
              <div
                className="brand-color-preview"
                style={{ background: isDark ? color.hex.dark : color.hex.light }}
              />
              <div className="brand-color-info">
                <span className="brand-color-name">{color.name}</span>
                <span className="brand-color-variable">{color.variable}</span>
                <div className="brand-color-values">
                  <span className="brand-color-hex">
                    {isDark ? color.hex.dark : color.hex.light}
                    <svg className="brand-copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </span>
                </div>
                <span className="brand-color-usage">{color.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Section */}
      <section className="brand-section scroll-animate" ref={typographyRef}>
        <span className="brand-section-label">03</span>
        <h2 className="brand-heading">Typography</h2>
        <p className="brand-subheading">Three typefaces, carefully paired for clarity and warmth</p>

        {/* Fraunces Specimen */}
        <div className="brand-type-specimen brand-type-specimen--fraunces">
          <div className="brand-type-specimen-header">
            <span className="brand-type-name">Fraunces</span>
            <span className="brand-type-category">Display Serif</span>
          </div>
          <div className="brand-type-display">Aa</div>
          <div className="brand-type-alphabet">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
            abcdefghijklmnopqrstuvwxyz<br/>
            0123456789
          </div>
          <div className="brand-type-meta">
            <div className="brand-type-meta-item">
              <strong>Weights</strong>
              <span>600 (Semibold)</span>
            </div>
            <div className="brand-type-meta-item">
              <strong>Usage</strong>
              <span>Headlines, section titles, brand moments</span>
            </div>
            <div className="brand-type-meta-item">
              <strong>Character</strong>
              <span>Warm, elegant, with soft terminals and optical sizing</span>
            </div>
          </div>
        </div>

        {/* Inter Specimen */}
        <div className="brand-type-specimen brand-type-specimen--inter">
          <div className="brand-type-specimen-header">
            <span className="brand-type-name" style={{ fontFamily: 'var(--font-sans)' }}>Inter</span>
            <span className="brand-type-category">Sans Serif</span>
          </div>
          <div className="brand-type-display" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400 }}>Aa</div>
          <div className="brand-type-alphabet" style={{ fontFamily: 'var(--font-sans)' }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
            abcdefghijklmnopqrstuvwxyz<br/>
            0123456789
          </div>
          <div className="brand-type-meta">
            <div className="brand-type-meta-item">
              <strong>Weights</strong>
              <span>400 (Regular), 500 (Medium)</span>
            </div>
            <div className="brand-type-meta-item">
              <strong>Usage</strong>
              <span>Body text, UI elements, navigation</span>
            </div>
            <div className="brand-type-meta-item">
              <strong>Character</strong>
              <span>Clean, highly legible, with tall x-height</span>
            </div>
          </div>
        </div>

        {/* JetBrains Mono Specimen */}
        <div className="brand-type-specimen brand-type-specimen--mono">
          <div className="brand-type-specimen-header">
            <span className="brand-type-name" style={{ fontFamily: 'var(--font-mono)' }}>JetBrains Mono</span>
            <span className="brand-type-category">Monospace</span>
          </div>
          <div className="brand-type-display" style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>01</div>
          <div className="brand-type-alphabet" style={{ fontFamily: 'var(--font-mono)' }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
            abcdefghijklmnopqrstuvwxyz<br/>
            {`=> -> !== === <= >= () {} []`}
          </div>
          <div className="brand-type-meta">
            <div className="brand-type-meta-item">
              <strong>Weights</strong>
              <span>400 (Regular), 500 (Medium)</span>
            </div>
            <div className="brand-type-meta-item">
              <strong>Usage</strong>
              <span>Code blocks, CLI commands, technical content</span>
            </div>
            <div className="brand-type-meta-item">
              <strong>Character</strong>
              <span>Ligatures for programming, high character distinction</span>
            </div>
          </div>
        </div>

        {/* Type Scale */}
        <h3 className="brand-subsection-title">Type Scale</h3>
        <div className="brand-type-scale">
          {TYPE_SCALE.map((item, index) => (
            <div
              key={index}
              className="brand-type-scale-item"
              onClick={() => handleCopy(item.variable, item.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCopy(item.variable, item.name)
                }
              }}
            >
              <span
                className="brand-type-scale-sample"
                style={{
                  fontSize: item.name === 'Code' ? item.size : undefined,
                  fontFamily: item.name === 'Code' ? 'var(--font-mono)' : (item.name === 'Hero' || item.name === 'Section' || item.name === 'Card Title') ? 'var(--font-display)' : 'var(--font-sans)'
                }}
              >
                {item.sample}
              </span>
              <span className="brand-type-scale-name">{item.name}</span>
              <span className="brand-type-scale-size">{item.px}</span>
              <span className="brand-type-scale-variable">{item.variable}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Voice & Tone Section */}
      <section className="brand-section scroll-animate" ref={voiceRef}>
        <span className="brand-section-label">04</span>
        <h2 className="brand-heading">Voice & Tone</h2>
        <p className="brand-subheading">Rooted in Radical Candor: caring personally while challenging directly</p>

        <div className="brand-philosophy">
          <blockquote className="brand-philosophy-quote">
            "The best feedback cares personally and challenges directly.
            It shows understanding of context and difficulty, while never
            hedging or softening real issues."
          </blockquote>
          <span className="brand-philosophy-source">Radical Candor Principles</span>
        </div>

        <div className="brand-voice-grid">
          <div className="brand-voice-panel brand-voice-panel--harsh">
            <div className="brand-voice-header">
              <span className="brand-voice-badge brand-voice-badge--harsh">Harsh Mode</span>
            </div>
            <div className="brand-voice-example">
              "This function is a mess. Six levels of nesting? Seriously?
              Refactor this before it infects the rest of the codebase."
            </div>
            <div className="brand-voice-description">
              Brutally honest feedback that doesn't sugar-coat issues.
            </div>
            <ul className="brand-voice-usecases">
              <li>Pre-commit self-review</li>
              <li>Finding edge cases</li>
              <li>Security audits</li>
              <li>When you want brutal honesty</li>
            </ul>
          </div>

          <div className="brand-voice-panel brand-voice-panel--constructive">
            <div className="brand-voice-header">
              <span className="brand-voice-badge brand-voice-badge--constructive">Constructive Mode</span>
            </div>
            <div className="brand-voice-example">
              "This function has grown complex. Consider extracting the
              validation logic into a helper function. Here's a suggested approach..."
            </div>
            <div className="brand-voice-description">
              Caring but direct feedback based on Radical Candor.
            </div>
            <ul className="brand-voice-usecases">
              <li>Team code reviews</li>
              <li>Mentoring situations</li>
              <li>Documentation reviews</li>
              <li>When teaching is the goal</li>
            </ul>
          </div>
        </div>

        {/* Writing Guidelines */}
        <h3 className="brand-subsection-title">Writing Guidelines</h3>
        <div className="brand-dos-donts">
          <div className="brand-guideline brand-guideline--do">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span>Be specific: "Line 42 has a potential null reference"</span>
          </div>
          <div className="brand-guideline brand-guideline--do">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span>Provide context: Explain why something matters</span>
          </div>
          <div className="brand-guideline brand-guideline--do">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span>Offer solutions: Don't just point out problems</span>
          </div>
          <div className="brand-guideline brand-guideline--dont">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span>Don't use vague language: "This could be better"</span>
          </div>
          <div className="brand-guideline brand-guideline--dont">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span>Don't be condescending: "Obviously you should..."</span>
          </div>
          <div className="brand-guideline brand-guideline--dont">
            <div className="brand-guideline-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span>Don't skip the why: Context builds understanding</span>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      <div className={`brand-toast ${showToast ? 'brand-toast--visible' : ''}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {toastMessage}
      </div>
    </>
  )
}
