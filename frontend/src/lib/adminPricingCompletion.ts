/** CMC calculator uses two Ayat strategy tables — configured via price row construction stage. */

export const CMC_INVENTORY_SLUG = 'cmc-extension'

export const CMC_STRATEGY_UNSTARTED = 'cmc-unstarted'
export const CMC_STRATEGY_NEAR = 'cmc-near-completion'

export type CmcConstructionStage = 'both' | 'unstarted' | 'near_completion'

export const CMC_CONSTRUCTION_OPTIONS: Array<{ value: CmcConstructionStage; label: string }> = [
  { value: 'both', label: 'Both calculator options (same rate)' },
  { value: 'unstarted', label: 'Not started / early construction' },
  { value: 'near_completion', label: 'Near completion' },
]

export function projectSlugById(projects: Array<{ id: string; slug: string }>): Map<string, string> {
  return new Map(projects.map((p) => [p.id, p.slug]))
}

export function isCmcInventoryProject(
  projectId: string | null | undefined,
  slugById: Map<string, string>,
): boolean {
  if (!projectId) return false
  return slugById.get(projectId) === CMC_INVENTORY_SLUG
}

export function constructionStageFromRow(
  row: { project_id: string | null; conditions: Record<string, unknown> | null },
  slugById: Map<string, string>,
): CmcConstructionStage | null {
  if (!isCmcInventoryProject(row.project_id, slugById)) return null
  const calcId = row.conditions?.calculator_project_id
  if (calcId === CMC_STRATEGY_UNSTARTED) return 'unstarted'
  if (calcId === CMC_STRATEGY_NEAR) return 'near_completion'
  return 'both'
}

export function constructionStageLabel(stage: CmcConstructionStage | null): string | null {
  if (!stage) return null
  return CMC_CONSTRUCTION_OPTIONS.find((o) => o.value === stage)?.label ?? null
}

export function conditionsForCmcStage(stage: CmcConstructionStage): Record<string, string> | null {
  if (stage === 'unstarted') return { calculator_project_id: CMC_STRATEGY_UNSTARTED }
  if (stage === 'near_completion') return { calculator_project_id: CMC_STRATEGY_NEAR }
  return null
}

export function buildPriceRowPayload(
  fields: {
    project_id: string
    unit_type_code: string
    floor_band: string
    price_per_sqm: string
    construction_stage?: string
  },
  slugById: Map<string, string>,
): {
  project_id: string | undefined
  unit_type_code: string
  floor_band: string
  price_per_sqm: string
  conditions: Record<string, string> | null
} {
  const projectId = fields.project_id || undefined
  const slug = projectId ? slugById.get(projectId) : undefined
  let conditions: Record<string, string> | null = null

  if (slug === CMC_INVENTORY_SLUG) {
    const stage = (fields.construction_stage as CmcConstructionStage) || 'both'
    conditions = conditionsForCmcStage(stage)
  }

  return {
    project_id: projectId,
    unit_type_code: fields.unit_type_code,
    floor_band: fields.floor_band,
    price_per_sqm: fields.price_per_sqm,
    conditions,
  }
}
