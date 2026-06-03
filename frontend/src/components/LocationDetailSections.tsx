import type { LocationCard, PublicLocationContent } from '../api/types'
import { LocationMediaPlayer } from './LocationMediaPlayer'
import { LocationPageSection } from './LocationPageSection'
import { ScrollReveal } from './ScrollReveal'

type LocationDetailSectionsProps = {
  content: PublicLocationContent | undefined
  cardsTitle: string
  mediaTitle: string
  mediaDescription?: string | null
  /** Apartment layouts use Properties listings instead of CMS cards. */
  showLayoutCards?: boolean
  /** Main video is shown in the page hero — only gallery images here. */
  hideMainVideo?: boolean
}

function filterCards(cards: LocationCard[] | undefined): LocationCard[] {
  return (cards ?? []).filter((c) => c.title?.trim())
}

export function LocationDetailSections({
  content,
  cardsTitle,
  mediaTitle,
  mediaDescription,
  showLayoutCards = true,
  hideMainVideo = false,
}: LocationDetailSectionsProps) {
  const cards = showLayoutCards ? filterCards(content?.cards) : []
  const galleryMedia = (content?.media ?? []).filter((m) => m.media_type === 'image')
  const extraVideos = (content?.media ?? []).filter((m) => m.media_type === 'video')
  const mainVideo = hideMainVideo ? null : content?.video_url?.trim()
  const hasMedia = Boolean(mainVideo || galleryMedia.length > 0 || extraVideos.length > 0)

  if (!hasMedia && cards.length === 0) {
    return null
  }

  return (
    <>
      {hasMedia ? (
        <LocationPageSection
          id="location-media"
          title={mediaTitle}
          description={mediaDescription}
        >
          <div className="space-y-6">
            {mainVideo ? (
              <ScrollReveal animation="scale" delayMs={80}>
                <LocationMediaPlayer url={mainVideo} />
              </ScrollReveal>
            ) : null}
            {galleryMedia.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryMedia.map((m, idx) => (
                  <ScrollReveal
                    key={m.id}
                    as="li"
                    animation="up"
                    delayMs={120 + idx * 90}
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <img src={m.url} alt={m.caption ?? ''} className="aspect-[4/3] w-full object-cover" />
                    {m.caption ? (
                      <p className="border-t border-border px-3 py-2 text-xs text-fg-muted">{m.caption}</p>
                    ) : null}
                  </ScrollReveal>
                ))}
              </ul>
            ) : null}
            {extraVideos.map((m, idx) => (
              <ScrollReveal key={m.id} animation="scale" delayMs={idx * 100}>
                <LocationMediaPlayer url={m.url} title={m.caption ?? 'Location video'} />
              </ScrollReveal>
            ))}
          </div>
        </LocationPageSection>
      ) : null}

      {cards.length > 0 ? (
        <LocationPageSection title={cardsTitle}>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, idx) => (
              <li
                key={`${card.title}-${idx}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                {card.image_url ? (
                  <img src={card.image_url} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/3] w-full bg-surface-muted" />
                )}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-fg">{card.title}</h3>
                  {card.body ? (
                    <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
                      {card.body}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </LocationPageSection>
      ) : null}
    </>
  )
}
