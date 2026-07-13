import type { CompletionKind, FinishKind } from '../data/ayatCalculatorConfig'
import type { CalculatorRuntimeConfig } from './calculatorRuntime'

export type ResidentialFloorRateEntry = {
  key: string
  projectId: string
  floorBandLabel: string
  floorMin: number
  floorMax: number
  unitTypeCode: string
  finishType: FinishKind
  pricePerSqm: number
  /** Present when this location has separate construction-stage rate tables (e.g. CMC). */
  completion: CompletionKind | null
}

function completionForProjectId(projectId: string): CompletionKind | null {
  if (projectId === 'cmc-near-completion') return 'near_completion'
  if (projectId === 'cmc-unstarted') return 'unstarted'
  return null
}

/** Project ids whose residentialPriceRows apply to this public location slug. */
export function residentialRateProjectIds(
  config: CalculatorRuntimeConfig,
  inventoryProjectId: string,
): string[] {
  const ids = new Set<string>([inventoryProjectId])
  const mapped = config.inventoryToStrategyLocation[inventoryProjectId]
  if (mapped) ids.add(mapped)

  if (inventoryProjectId === 'cmc-extension') {
    ids.add('cmc-unstarted')
    ids.add('cmc-near-completion')
  }

  for (const row of config.residentialPriceRows) {
    if (row.projectId === inventoryProjectId) ids.add(row.projectId)
  }

  return Array.from(ids)
}

/** Floor-band ETB/m² rows for a residential location (empty when no admin rates). */
export function collectResidentialFloorRates(
  config: CalculatorRuntimeConfig,
  inventoryProjectId: string,
): ResidentialFloorRateEntry[] {
  const projectIds = new Set(residentialRateProjectIds(config, inventoryProjectId))
  const seen = new Set<string>()
  const out: ResidentialFloorRateEntry[] = []

  for (const row of config.residentialPriceRows) {
    if (!projectIds.has(row.projectId) || row.pricePerSqm <= 0) continue
    const key = [
      row.projectId,
      row.floorBand.label,
      row.unitTypeCode,
      row.finishType,
      row.floorBand.floorMin,
      row.floorBand.floorMax,
    ].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      key,
      projectId: row.projectId,
      floorBandLabel: row.floorBand.label,
      floorMin: row.floorBand.floorMin,
      floorMax: row.floorBand.floorMax,
      unitTypeCode: row.unitTypeCode,
      finishType: row.finishType,
      pricePerSqm: row.pricePerSqm,
      completion: completionForProjectId(row.projectId),
    })
  }

  return out.sort((a, b) => {
    const stage = (a.completion ?? '').localeCompare(b.completion ?? '')
    if (stage !== 0) return stage
    if (a.floorMin !== b.floorMin) return a.floorMin - b.floorMin
    if (a.floorMax !== b.floorMax) return a.floorMax - b.floorMax
    return a.unitTypeCode.localeCompare(b.unitTypeCode)
  })
}

export function hasResidentialFloorRates(
  config: CalculatorRuntimeConfig,
  inventoryProjectId: string,
): boolean {
  return collectResidentialFloorRates(config, inventoryProjectId).length > 0
}
