import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { api } from '../api/client'
import {
  COMMERCIAL_AREA_MAX,
  COMMERCIAL_AREA_MIN,
  COMMERCIAL_AREA_PRESETS,
  DOWN_PAYMENT_TIERS,
  MILESTONE_SCHEDULES,
  RESIDENTIAL_PROJECTS,
  BEDROOM_AREA_OPTIONS,
} from '../data/ayatCalculatorConfig'
import { INVENTORY_TO_STRATEGY_LOCATION } from '../data/buildCalculatorFromOfficial'
import {
  calculatorConfigFromApi,
  type CalculatorRuntimeConfig,
  type PublicCalculatorConfigApi,
} from '../lib/calculatorRuntime'

/** Avoid showing Ayat default rates before live pricing loads (hides removed construction stages). */
export const CALCULATOR_CONFIG_FALLBACK: CalculatorRuntimeConfig = {
  currency: 'ETB',
  pricingVersionName: 'Loading…',
  residentialProjects: RESIDENTIAL_PROJECTS,
  residentialPriceRows: [],
  commercialZones: [],
  downPaymentTiers: DOWN_PAYMENT_TIERS,
  milestoneSchedules: MILESTONE_SCHEDULES,
  bedroomAreaOptions: BEDROOM_AREA_OPTIONS,
  commercialAreaMin: COMMERCIAL_AREA_MIN,
  commercialAreaMax: COMMERCIAL_AREA_MAX,
  commercialAreaPresets: COMMERCIAL_AREA_PRESETS,
  inventoryToStrategyLocation: INVENTORY_TO_STRATEGY_LOCATION,
  locationPromotions: [],
}

export type CalculatorConfigQuery = Omit<
  UseQueryResult<CalculatorRuntimeConfig, Error>,
  'data'
> & {
  data: CalculatorRuntimeConfig
}

export function useCalculatorConfig(companySlug = 'ayat-real-estate'): CalculatorConfigQuery {
  const query = useQuery({
    queryKey: ['public', 'calculator-config', companySlug],
    queryFn: async () => {
      const { data } = await api.get<PublicCalculatorConfigApi>('/public/calculator-config', {
        params: { company_slug: companySlug },
      })
      return calculatorConfigFromApi(data)
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: CALCULATOR_CONFIG_FALLBACK,
  })
  return {
    ...query,
    data: query.data ?? CALCULATOR_CONFIG_FALLBACK,
  }
}
