import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import {
  COMMERCIAL_AREA_MAX,
  COMMERCIAL_AREA_MIN,
  COMMERCIAL_AREA_PRESETS,
  COMMERCIAL_ZONES,
  DOWN_PAYMENT_TIERS,
  MILESTONE_SCHEDULES,
  RESIDENTIAL_PRICE_ROWS,
  RESIDENTIAL_PROJECTS,
  BEDROOM_AREA_OPTIONS,
} from '../data/ayatCalculatorConfig'
import { INVENTORY_TO_STRATEGY_LOCATION } from '../data/buildCalculatorFromOfficial'
import {
  calculatorConfigFromApi,
  type CalculatorRuntimeConfig,
  type PublicCalculatorConfigApi,
} from '../lib/calculatorRuntime'

const STATIC_FALLBACK: CalculatorRuntimeConfig = {
  currency: 'ETB',
  pricingVersionName: 'Official strategy (offline)',
  residentialProjects: RESIDENTIAL_PROJECTS,
  residentialPriceRows: RESIDENTIAL_PRICE_ROWS,
  commercialZones: COMMERCIAL_ZONES,
  downPaymentTiers: DOWN_PAYMENT_TIERS,
  milestoneSchedules: MILESTONE_SCHEDULES,
  bedroomAreaOptions: BEDROOM_AREA_OPTIONS,
  commercialAreaMin: COMMERCIAL_AREA_MIN,
  commercialAreaMax: COMMERCIAL_AREA_MAX,
  commercialAreaPresets: COMMERCIAL_AREA_PRESETS,
  inventoryToStrategyLocation: INVENTORY_TO_STRATEGY_LOCATION,
}

export function useCalculatorConfig(companySlug = 'ayat-real-estate') {
  return useQuery({
    queryKey: ['public', 'calculator-config', companySlug],
    queryFn: async () => {
      const { data } = await api.get<PublicCalculatorConfigApi>('/public/calculator-config', {
        params: { company_slug: companySlug },
      })
      return calculatorConfigFromApi(data)
    },
    staleTime: 5 * 60 * 1000,
    initialData: STATIC_FALLBACK,
  })
}
