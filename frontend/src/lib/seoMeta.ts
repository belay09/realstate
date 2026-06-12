import { DEFAULT_OG_IMAGE, SITE_SEO, SITE_URL, absoluteUrl } from '../content/siteSeo'

type MetaAttr = 'name' | 'property'

function upsertMeta(attr: MetaAttr, key: string, content: string | undefined) {
  if (!content) return
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string | undefined) {
  if (!href) return
  const selector = `link[rel="${rel}"]`
  let el = document.head.querySelector(selector) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

const JSON_LD_ID = 'page-jsonld'

export type SeoHeadInput = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
  siteName?: string
  noindex?: boolean
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export function applySeoHead(input: SeoHeadInput) {
  const {
    title,
    description,
    canonicalUrl,
    imageUrl,
    siteName = SITE_SEO.siteName,
    noindex,
    type = 'website',
    jsonLd,
  } = input

  document.title = title

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', SITE_SEO.keywords)
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
  if (SITE_SEO.googleSiteVerification) {
    upsertMeta('name', 'google-site-verification', SITE_SEO.googleSiteVerification)
  }
  upsertMeta('name', 'twitter:card', SITE_SEO.twitterCard)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', imageUrl)

  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:site_name', siteName)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonicalUrl)
  upsertMeta('property', 'og:image', imageUrl)
  upsertMeta('property', 'og:locale', SITE_SEO.locale)

  upsertLink('canonical', canonicalUrl)

  const existing = document.getElementById(JSON_LD_ID)
  if (existing) existing.remove()
  if (jsonLd) {
    const script = document.createElement('script')
    script.id = JSON_LD_ID
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: SITE_SEO.siteName,
    alternateName: 'Habesha Homes',
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    image: DEFAULT_OG_IMAGE,
    telephone: SITE_SEO.telephone,
    ...(SITE_SEO.email ? { email: SITE_SEO.email } : {}),
    description: SITE_SEO.defaultDescription,
    areaServed: {
      '@type': 'City',
      name: 'Addis Ababa',
      containedInPlace: { '@type': 'Country', name: 'Ethiopia' },
    },
    priceRange: 'Free advisory',
    knowsAbout: [
      'Residential real estate',
      'Apartments',
      'Commercial shops',
      'Ayat Share Company',
      'Temer Properties',
    ],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_SEO.siteName,
    alternateName: 'Habesha Homes',
    url: SITE_URL,
    description: SITE_SEO.defaultDescription,
    publisher: { '@type': 'Organization', name: SITE_SEO.siteName },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/apartments?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function listingJsonLd(input: {
  name: string
  description: string
  url: string
  image?: string | null
  price?: number | null
  currency?: string
  bedrooms?: number | null
  floorSize?: number | null
  sellerName?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.price != null
      ? {
          offers: {
            '@type': 'Offer',
            price: input.price,
            priceCurrency: input.currency ?? 'ETB',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    ...(input.bedrooms != null ? { numberOfRooms: input.bedrooms } : {}),
    ...(input.floorSize != null
      ? { floorSize: { '@type': 'QuantitativeValue', value: input.floorSize, unitCode: 'MTK' } }
      : {}),
    ...(input.sellerName
      ? { seller: { '@type': 'Organization', name: input.sellerName } }
      : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Addis Ababa',
      addressCountry: 'ET',
    },
  }
}
