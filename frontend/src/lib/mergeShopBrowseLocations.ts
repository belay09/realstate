import type { CommercialZone } from '../data/ayatCalculatorConfig'
import type { PublicLocationBrowseSummary, PublicLocationVisibility } from '../api/types'
import { isLocationActive } from './locationVisibility'
import type { ShopLocationSummary } from './shopLocations'

const EMPTY_FLOORS: CommercialZone['floors'] = { GF: 0, '1F': 0, '2F': 0, '3F': 0 }

/** Public /shops list: only Active location pages from CMS, enriched with calculator floor rates when ids match. */
export function mergeShopBrowseLocations(
  zones: ShopLocationSummary[],
  summaries: Map<string, PublicLocationBrowseSummary> | undefined,
  visibility: PublicLocationVisibility | undefined,
  companySlugFilter = '',
): ShopLocationSummary[] {
  if (!summaries) return []

  const byId = new Map(zones.map((z) => [z.id, z]))
  const merged: ShopLocationSummary[] = []

  for (const [locationId, cms] of summaries) {
    if (!isLocationActive(visibility, 'shop', locationId)) continue
    if (companySlugFilter && cms.company_slug !== companySlugFilter) continue
    const existing = byId.get(locationId)
    const displayTitle = cms.title.trim() || locationId
    if (existing) {
      merged.push({
        ...existing,
        displayTitle,
        coverImageUrl: cms.cover_image_url ?? existing.coverImageUrl,
      })
    } else {
      merged.push({
        id: locationId,
        labelKey: `calculator.shopZones.${locationId}`,
        floors: { ...EMPTY_FLOORS },
        displayTitle,
        coverImageUrl: cms.cover_image_url,
      })
    }
  }

  return merged.sort((a, b) => {
    const labelA = a.displayTitle ?? a.labelKey
    const labelB = b.displayTitle ?? b.labelKey
    return labelA.localeCompare(labelB)
  })
}
