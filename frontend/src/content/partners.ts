/** Partner developer facts (proper nouns stay in English). Copy is in i18n locales. */

export const AYAT_PARTNER = {
  slug: 'ayat-real-estate',
  legalName: 'Ayat Share Company',
  brandName: 'Ayat Real Estate',
  website: 'https://ayatrealestate.com/',
  yearsEstablished: '25+',
  logoUrl: 'https://ayatrealestate.com/_next/static/media/ayat_logo.daf534f7.webp',
} as const

export const TEMER_PARTNER = {
  slug: 'temer-properties',
  legalName: 'Temer Properties',
  brandName: 'Temer Properties',
  website: 'https://temerproperties.com/',
  hotline: '6033',
  phone: '+251975666699',
  logoUrl:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBSnuQ_vYSyLKopmM2ylazSbKkdxR2loqEaw&s',
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
