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
      <ul className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {visible.map((item, index) => (
          <li key={item.slug}>
            <LocationLayoutCard listing={item} index={index} />
          </li>
        ))}
      </ul>
    </LocationPageSection>
  )
}
