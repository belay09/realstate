import type { CommercialZone } from '../data/ayatCalculatorConfig'
import type { PublicLocationBrowseSummary, PublicLocationVisibility } from '../api/types'
import { isLocationActive } from './locationVisibility'
import type { ShopLocationSummary } from './shopLocations'

const EMPTY_FLOORS: CommercialZone['floors'] = { GF: 0, '1F': 0, '2F': 0, '3F': 0 }

/** Merge CMS shop locations with calculator zones (apartments already merge; shops did not). */
export function mergeShopBrowseLocations(
  zones: ShopLocationSummary[],
  summaries: Map<string, PublicLocationBrowseSummary> | undefined,
  visibility: PublicLocationVisibility | undefined,
): ShopLocationSummary[] {
  const byId = new Map(zones.map((z) => [z.id, z]))
  const merged: ShopLocationSummary[] = []
  const seen = new Set<string>()

  if (summaries) {
    for (const [locationId, cms] of summaries) {
      if (!isLocationActive(visibility, 'shop', locationId)) continue
      seen.add(locationId)
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
  }

  for (const zone of zones) {
    if (seen.has(zone.id)) continue
    if (!isLocationActive(visibility, 'shop', zone.id)) continue
    merged.push(zone)
    seen.add(zone.id)
  }

  return merged.sort((a, b) => {
    const labelA = a.displayTitle ?? a.labelKey
    const labelB = b.displayTitle ?? b.labelKey
    return labelA.localeCompare(labelB)
  })
}
