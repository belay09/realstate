/** Partner developer facts (proper nouns stay in English). Copy is in i18n locales. */

export const AYAT_PARTNER = {
  slug: 'ayat-real-estate',
  legalName: 'Ayat Share Company',
  brandName: 'Ayat Real Estate',
  website: 'https://ayatrealestate.com/',
  yearsEstablished: '25+',
  // Hosted locally - remote ayatrealestate.com logo URL is unreliable / often blocked.
  logoUrl: '/partners/ayat.svg',
} as const

export const TEMER_PARTNER = {
  slug: 'temer-properties',
  legalName: 'Temer Properties',
  brandName: 'Temer Properties',
  website: 'https://temerproperties.com/',
  logoUrl: '/partners/temer.svg',
} as const

export const PARTNER_SLUGS = [AYAT_PARTNER.slug, TEMER_PARTNER.slug] as const

export type PartnerSlug = (typeof PARTNER_SLUGS)[number]

export const PARTNERS_BY_SLUG = {
  [AYAT_PARTNER.slug]: AYAT_PARTNER,
  [TEMER_PARTNER.slug]: TEMER_PARTNER,
} as const

export function partnerForSlug(slug: string | null | undefined) {
  if (!slug) return null
  return PARTNERS_BY_SLUG[slug as PartnerSlug] ?? null
}
