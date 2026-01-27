/**
 * OrganizationSchema - JSON-LD schema for organization information
 * Helps search engines understand the organization behind the site
 */
export default function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Candid',
    url: 'https://www.candid.tools',
    logo: 'https://www.candid.tools/favicon.svg',
    description: 'Intelligent code reviews plugin for Claude Code',
    sameAs: [
      'https://github.com/ron-myers/candid',
      'https://join.slack.com/t/candid-knc4230/shared_invite/zt-3norwiria-gvg9iQ0Dkg8x43diCcKLrw',
      'https://www.linkedin.com/company/fritter-factory/',
    ],
    founder: {
      '@type': 'Organization',
      name: 'Fritter Factory',
      url: 'https://www.fritterfactory.com',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
