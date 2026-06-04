import type { PublicListingSummary } from '../api/types'
import { LocationLayoutCard } from './LocationLayoutCard'
import { LocationPageSection } from './LocationPageSection'

type LocationListingCardsProps = {
  listings: PublicListingSummary[]
  title: string
  subtitle?: string | null
  sectionId?: string
  eyebrow?: string
}

function gridClass(count: number) {
  if (count === 1) return 'grid grid-cols-1 gap-6'
  return 'grid grid-cols-1 gap-6 md:grid-cols-2'
}

export function LocationListingCards({
  listings,
  title,
  subtitle,
  sectionId = 'location-layouts',
  eyebrow,
}: LocationListingCardsProps) {
  const visible = listings.filter((l) => l.title?.trim())
  if (visible.length === 0) return null

  return (
    <LocationPageSection
      id={sectionId}
      eyebrow={eyebrow}
      title={title}
      description={subtitle ?? undefined}
    >
      <ul className={gridClass(visible.length)}>
        {visible.map((item, index) => (
          <li key={item.slug} className="@container min-h-0">
            <LocationLayoutCard listing={item} index={index} />
          </li>
        ))}
      </ul>
    </LocationPageSection>
  )
}
