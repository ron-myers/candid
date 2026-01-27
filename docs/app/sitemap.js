import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SITE_URL = 'https://www.candid.tools'

/**
 * Get the last git modification date for a file
 */
function getGitTimestamp(filePath) {
  try {
    const timestamp = execSync(`git log -1 --format=%aI "${filePath}"`, {
      encoding: 'utf-8',
    }).trim()

    // Validate the timestamp before creating a Date
    if (timestamp && timestamp.length > 0) {
      const date = new Date(timestamp)
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  } catch {
    // Git command failed, fall through to default
  }

  // Fallback to current date
  return new Date()
}

/**
 * Calculate priority based on URL path depth and type
 */
function calculatePriority(urlPath) {
  if (urlPath === '/') return 1.0
  if (urlPath === '/docs') return 0.9

  // Count the depth (number of slashes)
  const depth = (urlPath.match(/\//g) || []).length

  // Section index pages (e.g., /docs/get-started)
  if (depth === 2) return 0.8

  // Subsection pages (e.g., /docs/get-started/first-review)
  return 0.6
}

/**
 * Get change frequency based on URL path
 */
function getChangeFrequency(urlPath) {
  if (urlPath === '/') return 'weekly'
  if (urlPath.includes('/changelog')) return 'weekly'
  return 'monthly'
}

/**
 * Recursively discover all documentation routes
 */
async function discoverDocRoutes(docsDir, baseUrlPath = '/docs') {
  const routes = []

  try {
    const entries = await fs.readdir(docsDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(docsDir, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subPath = `${baseUrlPath}/${entry.name}`
        const subRoutes = await discoverDocRoutes(fullPath, subPath)
        routes.push(...subRoutes)
      } else if (entry.name === 'page.mdx') {
        // Found a documentation page
        const urlPath = baseUrlPath
        const lastModified = getGitTimestamp(fullPath)
        const priority = calculatePriority(urlPath)
        const changeFrequency = getChangeFrequency(urlPath)

        routes.push({
          url: `${SITE_URL}${urlPath}`,
          lastModified,
          changeFrequency,
          priority,
        })
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${docsDir}:`, error.message)
  }

  return routes
}

/**
 * Generate sitemap entries for all pages
 */
export default async function sitemap() {
  const routes = []

  // Add homepage
  const homepagePath = path.join(process.cwd(), 'app', '(marketing)', 'page.jsx')
  routes.push({
    url: SITE_URL,
    lastModified: getGitTimestamp(homepagePath),
    changeFrequency: 'weekly',
    priority: 1.0,
  })

  // Discover all documentation routes
  const docsDir = path.join(process.cwd(), 'app', 'docs')
  const docRoutes = await discoverDocRoutes(docsDir)
  routes.push(...docRoutes)

  // Sort by priority (highest first) then by URL
  routes.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }
    return a.url.localeCompare(b.url)
  })

  return routes
}
