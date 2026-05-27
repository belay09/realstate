import type { CommercialZone } from '../data/ayatCalculatorConfig'
import { COMMERCIAL_ZONES } from '../data/ayatCalculatorConfig'

export type ShopLocationSummary = {
  kind: 'commercial'
  id: string
  labelKey: string
  floors: CommercialZone['floors']
}

export function getShopLocations(): ShopLocationSummary[] {
  return COMMERCIAL_ZONES.map((zone) => ({
    kind: 'commercial' as const,
    id: zone.id,
    labelKey: zone.labelKey,
    floors: zone.floors,
  }))
}

export function getShopLocationById(zoneId: string): ShopLocationSummary | undefined {
  return getShopLocations().find((z) => z.id === zoneId)
}

export function shopFloorKeys(zone: ShopLocationSummary): Array<keyof CommercialZone['floors']> {
  return (['GF', '1F', '2F', '3F'] as const).filter((f) => zone.floors[f] > 0)
}
