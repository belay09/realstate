import { SITE_BRAND } from './siteContact'

/** Default share image (1200×630 crop). Replace with /og-image.jpg on CDN when available. */
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=630&fit=crop&q=85'

function normalizeSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim() || 'https://habesha-homes.com'
  return raw.replace(/\/$/, '')
}

export const SITE_URL = normalizeSiteUrl()

export const SITE_SEO = {
  siteName: SITE_BRAND.name,
  defaultDescription:
    'Free real estate advisory in Addis Ababa. Compare Ayat and Temer apartments and shops. No buyer fees, no commission — Habesha Real Estate Advisory.',
  keywords:
    'Addis Ababa apartments, Ethiopia real estate, Ayat homes, Temer properties, free property advisory, Habesha homes, apartment for sale Addis Ababa',
  locale: 'en_ET',
  twitterCard: 'summary_large_image' as const,
  ogImage: DEFAULT_OG_IMAGE,
  telephone: '+251962750710',
  email: import.meta.env.VITE_CONTACT_EMAIL?.trim() || undefined,
  googleSiteVerification: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || undefined,
} as const

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}
