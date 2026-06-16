import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { PublicHomeCard } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import { HomeCmsCardPanel } from './HomeCmsCardPanel'
import { HomeDevelopersSection } from './HomeDevelopersSection'

function HomeCmsCardsSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-3xl bg-surface-muted" />
      ))}
    </div>
  )
}

export function HomeCmsCardsSection() {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['public', 'home-cards'],
    queryFn: async () => {
      const { data } = await api.get<PublicHomeCard[]>('/public/home-cards')
      return data
    },
    staleTime: 60_000,
  })

  if (query.isLoading) {
    return <HomeCmsCardsSkeleton />
  }

  const cards = [...(query.data ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  if (cards.length === 0) {
    return <HomeDevelopersSection />
  }

  return (
    <section className="overflow-hidden" aria-label={t('home.inventoryTitle')}>
      {cards.map((card, index) => (
        <HomeCmsCardPanel key={card.card_key} card={card} reverse={index % 2 === 1} index={index} />
      ))}
    </section>
  )
}
