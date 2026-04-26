import BrandPageClient from './BrandPageClient'

export const metadata = {
  title: 'Brand Guidelines',
  description: 'Official brand guidelines for Candid - logos, colors, typography, and voice.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function BrandPage() {
  return <BrandPageClient />
}
