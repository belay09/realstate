import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { PublicLocationVisibility } from '../api/types'

export function useLocationVisibility() {
  return useQuery({
    queryKey: ['public', 'location-visibility'],
    queryFn: async () => {
      const { data } = await api.get<PublicLocationVisibility>('/public/location-content/visibility')
      return data
    },
    staleTime: 60_000,
  })
}
