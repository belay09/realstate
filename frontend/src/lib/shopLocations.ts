import type { CommercialZone } from '../data/ayatCalculatorConfig'
import { COMMERCIAL_ZONES } from '../data/ayatCalculatorConfig'
import type { CalculatorRuntimeConfig } from './calculatorRuntime'

export type ShopLocationSummary = {
  id: string
  labelKey: string
  floors: CommercialZone['floors']
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
