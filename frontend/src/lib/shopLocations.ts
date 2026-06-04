import type { CommercialZone } from '../data/ayatCalculatorConfig'
import { COMMERCIAL_ZONES } from '../data/ayatCalculatorConfig'
import type { CalculatorRuntimeConfig } from './calculatorRuntime'

export type ShopLocationSummary = {
  id: string
  labelKey: string
  floors: CommercialZone['floors']
  /** Title from location CMS when present */
  displayTitle?: string
  coverImageUrl?: string | null
}

export function shopLocationTitle(
  location: ShopLocationSummary,
  t: (key: string) => string,
): string {
  if (location.displayTitle?.trim()) return location.displayTitle.trim()
  const translated = t(location.labelKey)
  if (translated !== location.labelKey) return translated
  return location.id
}

export function shopLocationsFromConfig(
  config: Pick<CalculatorRuntimeConfig, 'commercialZones'>,
): ShopLocationSummary[] {
  return config.commercialZones.map((zone) => ({
    id: zone.id,
    labelKey: zone.labelKey,
    floors: zone.floors,
  }))
}

/** @deprecated Use shopLocationsFromConfig with useCalculatorConfig */
export function getShopLocations(): ShopLocationSummary[] {
  return shopLocationsFromConfig({ commercialZones: COMMERCIAL_ZONES })
}

export function getShopLocationById(
  zoneId: string,
  zones: ShopLocationSummary[] = getShopLocations(),
): ShopLocationSummary | undefined {
  return zones.find((z) => z.id === zoneId)
}

export function shopFloorKeys(zone: ShopLocationSummary): (keyof CommercialZone['floors'])[] {
  return (['GF', '1F', '2F', '3F'] as const).filter((k) => zone.floors[k] > 0)
}
