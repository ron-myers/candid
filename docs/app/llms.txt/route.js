import { promises as fs } from 'fs'
import path from 'path'

const SITE_URL = 'https://www.candid.tools'

const SECTION_LABELS = {
  'get-started': 'Get Started',
  'core-features': 'Core Features',
  'how-to-guides': 'How-to Guides',
  quickstart: 'Quickstart',
  reference: 'Reference',
  'tips-troubleshooting': 'Tips & Troubleshooting',
  resources: 'Resources',
}

const SECTION_ORDER = [
  'get-started',
  'core-features',
  'how-to-guides',
  'quickstart',
  'reference',
  'tips-troubleshooting',
  'resources',
]

/**
 * Extract the first H1 heading from MDX content
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

/**
 * Extract the first descriptive paragraph from MDX content (after H1)
 */
function extractDescription(content) {
  // Remove export statements and JSX blocks
  const cleaned = content
    .replace(/^export\s+const\s+\w+\s*=\s*\{[\s\S]*?\}\s*$/gm, '')
    .replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '')

  const lines = cleaned.split('\n')
  let pastH1 = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!pastH1) {
      if (/^#\s+/.test(trimmed)) pastH1 = true
      continue
    }
    // Skip blank lines, headings, code blocks, JSX, list items, imports
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('```') ||
      trimmed.startsWith('<') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith('>')
    ) {
      continue
    }
    // Return first plain text paragraph
    return trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  }

  return null
}

/**
 * Recursively discover all page.mdx files and return page info grouped by section
 */
async function discoverPages(docsDir, urlBase = '/docs') {
  const pages = []

  try {
    const entries = await fs.readdir(docsDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(docsDir, entry.name)

      if (entry.isDirectory()) {
        const subPages = await discoverPages(fullPath, `${urlBase}/${entry.name}`)
        pages.push(...subPages)
      } else if (entry.name === 'page.mdx') {
        const content = await fs.readFile(fullPath, 'utf-8')
        const title = extractTitle(content)
        const description = extractDescription(content)

        // Determine section: first path segment after /docs
        const segments = urlBase.replace('/docs', '').split('/').filter(Boolean)
        const section = segments[0] || null

        pages.push({ url: `${SITE_URL}${urlBase}`, title, description, section, depth: segments.length })
      }
    }
  } catch {
    // Skip unreadable directories
  }

  return pages
}

export async function GET() {
  const docsDir = path.join(process.cwd(), 'app', 'docs')
  const allPages = await discoverPages(docsDir)

  // Group pages by section
  const sections = {}
  for (const page of allPages) {
    const key = page.section || '__root'
    if (!sections[key]) sections[key] = []
    sections[key].push(page)
  }

  // Sort pages within each section: index pages first, then alphabetically by depth/url
  for (const key of Object.keys(sections)) {
    sections[key].sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth
      return a.url.localeCompare(b.url)
    })
  }

  const lines = []

  lines.push('# Candid')
  lines.push('')
  lines.push('> Candid is a Claude Code plugin for intelligent, configurable code reviews based on Radical Candor. It analyzes your git diff, identifies issues across security, performance, architecture, and more, and provides concrete fixes — all without leaving Claude Code.')
  lines.push('')
  lines.push(`Documentation: ${SITE_URL}/docs`)
  lines.push(`GitHub: https://github.com/ron-myers/candid`)
  lines.push(`Slack community: https://join.slack.com/t/candid-knc4230/shared_invite/zt-3norwiria-gvg9iQ0Dkg8x43diCcKLrw`)
  lines.push('')

  for (const sectionKey of SECTION_ORDER) {
    const pages = sections[sectionKey]
    if (!pages || pages.length === 0) continue

    const label = SECTION_LABELS[sectionKey]
    lines.push(`## ${label}`)
    lines.push('')

    for (const page of pages) {
      const title = page.title || sectionKey
      const desc = page.description ? `: ${page.description}` : ''
      lines.push(`- [${title}](${page.url})${desc}`)
    }

    lines.push('')
  }

  const body = lines.join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
