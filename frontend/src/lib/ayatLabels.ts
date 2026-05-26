import type { Translator } from '../i18n/translate'

/** Turn Ayat floor band keys like "1-4" into readable text for clients. */
export function formatFloorBandLabel(band: string, t: Translator): string {
  const match = band.match(/^(\d+)-(\d+)$/)
  if (match) {
    return t('calculator.floorBandRange', { from: match[1], to: match[2] })
  }
  return band
}

export function formatShopFloorLabel(floorKey: string, t: Translator): string {
  const key = `calculator.shopFloor.${floorKey}` as const
  return t(key)
}

export function formatUnitTypeLabel(code: string, t: Translator): string {
  const label = t(`calculator.unitTypes.${code}`)
  if (label === `calculator.unitTypes.${code}`) {
    return t('calculator.unitTypeUnknown')
  }
  return label
}

export function formatSquareMeters(value: number, t: Translator): string {
  return t('calculator.squareMetersValue', { value })
}

export function formatBedroomCount(count: 1 | 2 | 3, t: Translator): string {
  if (count === 1) return t('calculator.oneBedroom')
  if (count === 2) return t('calculator.twoBedrooms')
  return t('calculator.threeBedrooms')
}
