import BrandPageClient from './BrandPageClient'

export const metadata = {
  title: 'Brand Guidelines | Candid',
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
