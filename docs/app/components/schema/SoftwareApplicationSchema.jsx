/**
 * SoftwareApplicationSchema - JSON-LD schema for software product
 * Helps search engines understand the software product
 * Used on homepage and product pages
 */
export default function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Candid',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    description: 'Intelligent code reviews plugin for Claude Code based on Radical Candor',
    url: 'https://www.candid.tools',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    softwareVersion: '1.6.0',
    author: {
      '@type': 'Organization',
      name: 'Fritter Factory',
      url: 'https://www.fritterfactory.com',
    },
    installUrl: 'https://github.com/ron-myers/candid',
    screenshot: 'https://www.candid.tools/screenshots/candid-review-activation.png',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
