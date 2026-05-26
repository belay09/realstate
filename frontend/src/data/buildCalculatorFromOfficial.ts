/**
 * Builds calculator constants from backend/data/ayat_official_2018.json (official Ayat strategy).
 */
import official from '../../../backend/data/ayat_official_2018.json'
import type {
  CommercialZone,
  FinishKind,
  MilestoneScheduleId,
  MilestoneStep,
  ResidentialPriceRow,
  ResidentialProject,
} from './ayatCalculatorConfig'

const SEMI_TYPES = ['SFCA', 'SFCR'] as const
const REG_TYPES = ['RFCA', 'RFCR'] as const

const FINISH: Record<string, FinishKind> = {
  SFCA: 'semi-finished',
  SFCR: 'semi-finished',
  RFCA: 'regular-finished',
  RFCR: 'regular-finished',
}

function bandPrice(
  loc: Record<string, Record<string, number>>,
  code: string,
  band: string,
): number | undefined {
  const p = loc[code]?.[band]
  if (p != null) return p
  if (code === 'SFCR') return loc.SFCA?.[band]
  return undefined
}

export function buildResidentialPriceRows(): ResidentialPriceRow[] {
  const s10 = official.section10_apartments
  const rows: ResidentialPriceRow[] = []
  for (const [projectId, location] of Object.entries(s10.locations)) {
    const loc = location as { SFCA?: Record<string, number>; SFCR?: Record<string, number>; RFCA?: Record<string, number>; RFCR?: Record<string, number> }
    for (const band of s10.floor_bands) {
      for (const code of [...SEMI_TYPES, ...REG_TYPES]) {
        const price = bandPrice(loc as Record<string, Record<string, number>>, code, band.label)
        if (price == null) continue
        rows.push({
          projectId,
          unitTypeCode: code,
          finishType: FINISH[code],
          floorBand: { label: band.label, floorMin: band.floor_min, floorMax: band.floor_max },
          pricePerSqm: price,
        })
      }
    }
  }
  return rows
}

export const OFFICIAL_BEDROOM_AREA_OPTIONS: Record<1 | 2 | 3, number[]> = {
  1: official.section2_bedroom_sizes_sqm['1'] as number[],
  2: official.section2_bedroom_sizes_sqm['2'] as number[],
  3: [...official.section2_bedroom_sizes_sqm['3'], 107] as number[],
}

// Map zone ids to existing i18n keys
const SHOP_LABEL_KEYS: Record<string, string> = {
  ledeta: 'calculator.shopZones.ledeta',
  kazanchis: 'calculator.shopZones.kazanchis',
  'bole-air': 'calculator.shopZones.boleAir',
  'zone-2': 'calculator.shopZones.zone2',
  'meri-luke-1': 'calculator.shopZones.meriLuke1',
  summit: 'calculator.shopZones.summit',
  'zone-3-university': 'calculator.shopZones.zone3University',
  'zone-8-linda': 'calculator.shopZones.zone8Linda',
}

export function buildCommercialZones(): CommercialZone[] {
  return official.section11_shops.zones.map((z) => ({
    id: z.id,
    labelKey: SHOP_LABEL_KEYS[z.id] ?? `calculator.shopZones.${z.id}`,
    floors: {
      GF: z.floors.GF ?? 0,
      '1F': z.floors['1F'] ?? 0,
      '2F': z.floors['2F'] ?? 0,
      '3F': z.floors['3F'] ?? 0,
    },
  }))
}

export const OFFICIAL_RESIDENTIAL_PROJECTS: ResidentialProject[] = [
  {
    id: 'lideta-unstarted',
    areaLabelKey: 'calculator.zones.lideta',
    nameKey: 'calculator.projects.lideta',
    maxFloor: 36,
    supportsCompletionChoice: false,
    usesStrategyFloorTable: true,
  },
  {
    id: 'kazanchis-started',
    areaLabelKey: 'calculator.zones.kazanchis',
    nameKey: 'calculator.projects.kazanchis',
    maxFloor: 36,
    supportsCompletionChoice: false,
    usesStrategyFloorTable: true,
  },
  {
    id: 'bole-unstarted',
    areaLabelKey: 'calculator.zones.bole',
    nameKey: 'calculator.projects.bole',
    maxFloor: 36,
    supportsCompletionChoice: false,
    usesStrategyFloorTable: true,
  },
  {
    id: 'cmc-unstarted',
    areaLabelKey: 'calculator.zones.cmc',
    nameKey: 'calculator.projects.cmcUnstarted',
    maxFloor: 36,
    supportsCompletionChoice: false,
    usesStrategyFloorTable: true,
  },
  {
    id: 'cmc-near-completion',
    areaLabelKey: 'calculator.zones.cmc',
    nameKey: 'calculator.projects.cmcNearCompletion',
    maxFloor: 36,
    supportsCompletionChoice: false,
    usesStrategyFloorTable: true,
  },
  {
    id: 'cmc-extension',
    areaLabelKey: 'calculator.zones.cmc',
    nameKey: 'calculator.projects.cmc',
    maxFloor: 17,
    supportsCompletionChoice: true,
  },
  {
    id: 'ayat-hills',
    areaLabelKey: 'calculator.zones.ayatMainVillage',
    nameKey: 'calculator.projects.ayatHills',
    maxFloor: 16,
    supportsCompletionChoice: false,
    usesStrategyFloorTable: true,
  },
]

export function resolveResidentialProjectId(
  projectId: string,
  completion: 'unstarted' | 'near_completion',
): string {
  if (projectId === 'cmc-extension') {
    return completion === 'near_completion' ? 'cmc-near-completion' : 'cmc-unstarted'
  }
  if (projectId === 'ayat-hills') {
    return 'lideta-unstarted'
  }
  return projectId
}

export function buildMilestoneSchedules(): Record<MilestoneScheduleId, MilestoneStep[]> {
  const m = official.section13_milestones
  const labelKeys: Record<string, string> = {
    sign: 'calculator.milestones.signing',
    m4: 'calculator.milestones.month4',
    m8: 'calculator.milestones.month8',
    m12: 'calculator.milestones.month12',
    m18: 'calculator.milestones.month18',
    m24: 'calculator.milestones.month24',
    structure: 'calculator.milestones.structure',
    handover: 'calculator.milestones.handover',
  }
  const out = {} as Record<MilestoneScheduleId, MilestoneStep[]>
  for (const [id, steps] of Object.entries(m)) {
    out[id as MilestoneScheduleId] = steps.map((s) => ({
      id: s.id,
      labelKey: labelKeys[s.id] ?? s.id,
      percent: s.percent,
    }))
  }
  return out
}
