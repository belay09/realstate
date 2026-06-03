import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { PublicLocationBrowseSummary } from '../api/types'

export function useLocationBrowseSummaries(kind: 'apartment' | 'shop') {
  return useQuery({
    queryKey: ['public', 'location-summaries', kind],
    queryFn: async () => {
      const { data } = await api.get<PublicLocationBrowseSummary[]>(
        `/public/location-content/${kind}/summaries`,
      )
      const map = new Map<string, PublicLocationBrowseSummary>()
      for (const row of data) {
        map.set(row.location_id, row)
      }
      return map
    },
    staleTime: 60_000,
  })
}
