import type { LocationBuildingSettings, PublicListingSummary } from '../api/types'

export type BuildingType = 'mixed' | 'duplex' | 'flat'
export type UseSegment = 'retail' | 'residential'

export const BUILDING_TYPE_ORDER: BuildingType[] = ['mixed', 'duplex', 'flat']

export const DEFAULT_MIXED_FLOORS = {
  retail_floor_max: 3,
  residential_floor_min: 4,
  shop_zone_id: 'kazanchis',
} as const

export function defaultBuildingSettings(locationId: string): LocationBuildingSettings {
  const shopZone =
    locationId === 'kazanchis-residential' ? 'kazanchis' : locationId.replace(/-residential$/, '')
  return {
    enabled_types: ['mixed', 'duplex', 'flat'],
    mixed: {
      enabled: true,
      retail_floor_max: DEFAULT_MIXED_FLOORS.retail_floor_max,
      residential_floor_min: DEFAULT_MIXED_FLOORS.residential_floor_min,
      shop_zone_id: shopZone,
    },
    tower_overrides: [],
  }
}

export function resolveBuildingSettings(
  locationId: string,
  settings: LocationBuildingSettings | null | undefined,
): LocationBuildingSettings {
  if (!settings || Object.keys(settings).length === 0) {
    return defaultBuildingSettings(locationId)
  }
  const base = defaultBuildingSettings(locationId)
  return {
    enabled_types: settings.enabled_types ?? base.enabled_types,
    mixed: { ...base.mixed!, ...settings.mixed },
    tower_overrides: settings.tower_overrides ?? [],
  }
}

export function listingBuildingType(item: PublicListingSummary): BuildingType | null {
  const t = item.building_type
  if (t === 'mixed' || t === 'duplex' || t === 'flat') return t
  return null
}

export function listingUseSegment(item: PublicListingSummary): UseSegment | null {
  const s = item.use_segment
  if (s === 'retail' || s === 'residential') return s
  return null
}

export function floorRulesForTower(
  settings: LocationBuildingSettings,
  towerCode: string | null | undefined,
) {
  const mixed = settings.mixed ?? defaultBuildingSettings('').mixed!
  const override = settings.tower_overrides?.find(
    (row) => row.tower_code.trim().toLowerCase() === (towerCode ?? '').trim().toLowerCase(),
  )
  if (override) {
    return {
      retail_floor_max: override.retail_floor_max,
      residential_floor_min: override.residential_floor_min,
      tower_label: override.label ?? override.tower_code,
    }
  }
  return {
    retail_floor_max: mixed.retail_floor_max,
    residential_floor_min: mixed.residential_floor_min,
    tower_label: null as string | null,
  }
}

export function groupListingsByBuildingType(listings: PublicListingSummary[]) {
  const groups: Record<BuildingType, PublicListingSummary[]> = {
    mixed: [],
    duplex: [],
    flat: [],
  }
  const untagged: PublicListingSummary[] = []

  for (const item of listings) {
    const type = listingBuildingType(item)
    if (type) groups[type].push(item)
    else untagged.push(item)
  }

  return { groups, untagged }
}

export function hasBuildingTypeContent(
  settings: LocationBuildingSettings,
  groups: Record<BuildingType, PublicListingSummary[]>,
) {
  const enabled = settings.enabled_types ?? BUILDING_TYPE_ORDER
  return enabled.some((type) => groups[type].length > 0)
}
