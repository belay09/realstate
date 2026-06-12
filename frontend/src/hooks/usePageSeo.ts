import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { DEFAULT_OG_IMAGE, absoluteUrl } from '../content/siteSeo'
import { useTranslation } from '../context/LocaleContext'
import {
  applySeoHead,
  organizationJsonLd,
  websiteJsonLd,
  type SeoHeadInput,
} from '../lib/seoMeta'

export type PageSeoOptions = {
  /** Short page title (brand suffix added automatically). Empty = brand only. */
  title?: string
  description?: string
  image?: string | null
  /** Path for canonical URL; defaults to current pathname. */
  path?: string
  noindex?: boolean
  type?: 'website' | 'article'
  jsonLd?: SeoHeadInput['jsonLd']
  /** Home page: inject Organization + WebSite schema. */
  includeSiteJsonLd?: boolean
}

function resolveImage(image?: string | null): string {
  if (!image) return DEFAULT_OG_IMAGE
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return absoluteUrl(image)
}

export function usePageSeo(options: PageSeoOptions = {}) {
  const { messages } = useTranslation()
  const location = useLocation()
  const brand = messages.brand.name

  const {
    title = '',
    description = messages.seo.defaultDescription,
    image,
    path = location.pathname,
    noindex = false,
    type = 'website',
    jsonLd,
    includeSiteJsonLd = false,
  } = options

  useEffect(() => {
    const documentTitle = title ? `${title} · ${brand}` : brand
    const canonicalUrl = absoluteUrl(path)
    const imageUrl = resolveImage(image)

    const ld: SeoHeadInput['jsonLd'] = jsonLd
      ? jsonLd
      : includeSiteJsonLd
        ? [organizationJsonLd(), websiteJsonLd()]
        : undefined

    applySeoHead({
      title: documentTitle,
      description,
      canonicalUrl,
      imageUrl,
      siteName: brand,
      noindex,
      type,
      jsonLd: ld,
    })
  }, [
    title,
    description,
    image,
    path,
    noindex,
    type,
    jsonLd,
    includeSiteJsonLd,
    brand,
    location.pathname,
  ])
}
