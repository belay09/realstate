import { useMemo } from 'react'

import type { PublicLocationBrowseSummary, PublicLocationVisibility } from '../api/types'
import { useLocationBrowseSummaries } from './useLocationBrowseSummaries'
import { useLocationVisibility } from './useLocationVisibility'
import type { CalculatorRuntimeConfig } from '../lib/calculatorRuntime'
import { mergeShopBrowseLocations } from '../lib/mergeShopBrowseLocations'
import { shopLocationsFromConfig, type ShopLocationSummary } from '../lib/shopLocations'

/** Shop locations for calculator UI — only Active pages on /shops, with rates when configured. */
export function activeShopLocations(
  config: CalculatorRuntimeConfig,
  summaries: Map<string, PublicLocationBrowseSummary> | undefined,
  visibility: PublicLocationVisibility | undefined,
): ShopLocationSummary[] {
  return mergeShopBrowseLocations(shopLocationsFromConfig(config), summaries, visibility)
}

export function useActiveShopLocations(config: CalculatorRuntimeConfig): ShopLocationSummary[] {
  const { data: visibility } = useLocationVisibility()
  const summariesQuery = useLocationBrowseSummaries('shop')
  return useMemo(
    () => activeShopLocations(config, summariesQuery.data, visibility),
    [config, summariesQuery.data, visibility],
  )
}
