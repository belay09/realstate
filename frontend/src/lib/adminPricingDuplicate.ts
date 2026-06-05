import {
  buildPriceRowPayload,
  CMC_INVENTORY_SLUG,
  constructionStageFromRow,
  type CmcConstructionStage,
} from './adminPricingCompletion'

export type AdminPriceRow = {
  id: string
  project_id: string | null
  unit_type_code: string | null
  floor_band: string | null
  price_per_sqm: string | null
  fixed_price: string | null
  conditions: Record<string, unknown> | null
}

export type DuplicateConflictMode = 'skip' | 'replace' | 'add'

/** Same unit type, floor band, and CMC calculator stage = same logical rate slot. */
export function priceRowFingerprint(row: AdminPriceRow): string {
  const calcId = row.conditions?.calculator_project_id ?? ''
  return [row.unit_type_code ?? '', row.floor_band ?? '', String(calcId)].join('|')
}

export function findMatchingRow(
  rows: AdminPriceRow[],
  targetProjectId: string | null,
  fingerprint: string,
): AdminPriceRow | undefined {
  return rows.find(
    (row) =>
      (row.project_id ?? null) === targetProjectId && priceRowFingerprint(row) === fingerprint,
  )
}

export function duplicateRowPayload(
  row: AdminPriceRow,
  targetProjectId: string,
  slugById: Map<string, string>,
) {
  const targetSlug = slugById.get(targetProjectId)
  const stage: CmcConstructionStage =
    targetSlug === CMC_INVENTORY_SLUG
      ? (constructionStageFromRow(row, slugById) ?? 'both')
      : 'both'
  return buildPriceRowPayload(
    {
      project_id: targetProjectId,
      unit_type_code: row.unit_type_code ?? 'SFCA',
      floor_band: row.floor_band ?? '',
      price_per_sqm: row.price_per_sqm ?? row.fixed_price ?? '0',
      construction_stage: stage,
    },
    slugById,
  )
}
