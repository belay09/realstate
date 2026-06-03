import type { LocationCard, PublicLocationContent } from '../api/types'

type LocationDetailSectionsProps = {
  content: PublicLocationContent | undefined
  cardsTitle: string
  mediaTitle: string
}

function filterCards(cards: LocationCard[] | undefined): LocationCard[] {
  return (cards ?? []).filter((c) => c.title?.trim())
}

export function LocationDetailSections({
  content,
  cardsTitle,
  mediaTitle,
}: LocationDetailSectionsProps) {
  const cards = filterCards(content?.cards)
  const media = content?.media ?? []
  const hasMedia = Boolean(content?.video_url || media.length > 0)

  if (!hasMedia && cards.length === 0) {
    return null
  }

  return (
    <>
      {hasMedia ? (
        <section className="space-y-4">
          <h2 className="text-h3">{mediaTitle}</h2>
          {content?.video_url ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-border">
              <iframe
                src={content.video_url}
                className="h-full w-full"
                title="Location video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {media.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((m) => (
                <li key={m.id} className="surface overflow-hidden p-0">
                  {m.media_type === 'video' ? (
                    <video src={m.url} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <img src={m.url} alt={m.caption ?? ''} className="aspect-video w-full object-cover" />
                  )}
                  {m.caption ? <p className="px-3 py-2 text-xs text-fg-muted">{m.caption}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {cards.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-h3">{cardsTitle}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, idx) => (
              <li
                key={`${card.title}-${idx}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface"
              >
                {card.image_url ? (
                  <img src={card.image_url} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/3] w-full bg-surface-muted" />
                )}
                <div className="flex flex-1 flex-col p-5">
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
        </section>
      ) : null}
    </>
  )
}
