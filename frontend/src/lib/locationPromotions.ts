export type LocationPromotion = {
  id: string
  name: string
  kind: 'apartment' | 'shop'
  locationIds: string[]
  discountPercent: number
}

export type LocationPromotionLine = {
  id: string
  name: string
  percent: number
  amount: number
}

export function normalizePromotionFromApi(raw: {
  id: string
  name: string
  kind: string
  locationIds?: string[]
  location_ids?: string[]
  discountPercent?: number
  discount_percent?: number
}): LocationPromotion {
  return {
    id: raw.id,
    name: raw.name,
    kind: raw.kind as LocationPromotion['kind'],
    locationIds: raw.locationIds ?? raw.location_ids ?? [],
    discountPercent: raw.discountPercent ?? raw.discount_percent ?? 0,
  }
}

export function promotionForLocation(
  promotions: LocationPromotion[],
  kind: 'apartment' | 'shop',
  locationId: string,
): LocationPromotion | null {
  const lid = locationId.trim().toLowerCase()
  const matches = promotions.filter(
    (p) =>
      p.kind === kind &&
      p.locationIds.some((id) => id.trim().toLowerCase() === lid),
  )
  if (matches.length === 0) return null
  return matches.reduce((best, p) => (p.discountPercent > best.discountPercent ? p : best))
}

export function promotionDiscountAmount(priceAfterTier: number, percent: number): number {
  return Math.round((priceAfterTier * percent) / 100)
}
