import type { PublicListingSummary } from '../api/types'
import type { Translator } from '../i18n/translate'
import { formatBedroomCount } from './ayatLabels'

/**
 * Official development zones from Ayat Share Company sales strategy (Section 1).
 * Project slugs map to the zone used for pricing and public copy.
 */
export const AYAT_DEVELOPMENT_ZONES: Record<string, string> = {
  'ayat-hills': 'Ayat (Main Village)',
  'cmc-extension': 'CMC',
  'lideta-residential': 'Lideta',
  'kazanchis-residential': 'Kazanchis',
  'bole-belair': 'Bole (Belair)',
}

/** Section 3 apartment areas + common filter labels */
export const AYAT_ZONE_FILTER_OPTIONS = [
  { value: 'Ayat (Main Village)', label: 'Ayat (Main Village)' },
  { value: 'Bole Lemi', label: 'Bole Lemi' },
  { value: 'CMC', label: 'CMC' },
  { value: 'Bole Arabsa', label: 'Bole Arabsa' },
  { value: 'Bole Summit', label: 'Bole Summit' },
  { value: 'Michael Joro', label: 'Michael Joro' },
  { value: 'Lemmi', label: 'Lemmi' },
  { value: 'Kazanchis', label: 'Kazanchis' },
  { value: 'Lideta', label: 'Lideta' },
]

export function resolveDevelopmentZone(projectSlug: string, area: string | null): string {
  if (projectSlug && AYAT_DEVELOPMENT_ZONES[projectSlug]) {
    return AYAT_DEVELOPMENT_ZONES[projectSlug]
  }
  if (area) return area
  return ''
}

export function finishKindFromUnitTypeCode(code: string): 'semi-finished' | 'regular-finished' | null {
  if (code === 'SFCA' || code === 'SFCR') return 'semi-finished'
  if (code === 'RFCA' || code === 'RFCR') return 'regular-finished'
  return null
}

export function formatListingLocation(
  item: PublicListingSummary,
  t: Translator,
  defaultCityKey = 'listingCard.defaultCity',
): string {
  const zone = resolveDevelopmentZone(item.project_slug, item.area)
  const city = item.city ?? t(defaultCityKey)
  if (zone && city) return `${zone}, ${city}`
  if (zone) return zone
  return city
}

export function formatListingCardTitle(item: PublicListingSummary, t: Translator): string {
  const beds = item.bedrooms
  const finish = finishKindFromUnitTypeCode(item.unit_type_code)
  if (beds === 1 || beds === 2 || beds === 3) {
    const bedroomLabel = formatBedroomCount(beds, t)
    const finishLabel =
      finish === 'regular-finished'
        ? t('listingCard.regularFinished')
        : finish === 'semi-finished'
          ? t('listingCard.semiFinished')
          : item.unit_type_name
    return t('listingCard.titleTemplate', {
      bedrooms: bedroomLabel,
      finish: finishLabel,
      project: item.project_name,
    })
  }
  return item.title.replace(/\b(\d)\s*BR\b/gi, (_, n) => formatBedroomCount(Number(n) as 1 | 2 | 3, t))
}

export function formatListingBedrooms(item: PublicListingSummary, t: Translator): string | null {
  if (item.bedrooms === 1 || item.bedrooms === 2 || item.bedrooms === 3) {
    return formatBedroomCount(item.bedrooms, t)
  }
  return null
}
