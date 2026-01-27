'use client'

import { usePathname } from 'next/navigation'

/**
 * BreadcrumbSchema - JSON-LD schema for breadcrumb navigation
 * Dynamically generates breadcrumbs based on the current URL path
 * Helps search engines display breadcrumbs in search results
 */
export default function BreadcrumbSchema() {
  const pathname = usePathname()

  // Don't render breadcrumbs on homepage
  if (!pathname || pathname === '/') {
    return null
  }

  // Parse pathname into breadcrumb segments
  const pathSegments = pathname.split('/').filter(Boolean)

  // Build breadcrumb list items
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.candid.tools',
    },
  ]

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Convert slug to title (e.g., "get-started" -> "Get Started")
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    breadcrumbItems.push({
      '@type': 'ListItem',
      position: index + 2,
      name: name,
      item: `https://www.candid.tools${currentPath}`,
    })
  })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
