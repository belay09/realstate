import type { ListingMapPoint } from '../api/types'

type ListingMapEmbedProps = {
  map: ListingMapPoint
  className?: string
}

export function ListingMapEmbed({ map, className = '' }: ListingMapEmbedProps) {
  const delta = 0.012
  const bbox = [
    map.longitude - delta,
    map.latitude - delta,
    map.longitude + delta,
    map.latitude + delta,
  ].join('%2C')
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${map.latitude}%2C${map.longitude}`

  return (
    <div className={`overflow-hidden rounded-xl border border-border ${className}`}>
      <iframe
        title={map.label ?? 'Property location'}
        src={src}
        className="h-[min(420px,55vh)] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="border-t border-border bg-surface-muted px-4 py-2 text-xs text-fg-muted">
        {map.label ?? `${map.latitude.toFixed(4)}, ${map.longitude.toFixed(4)}`}{' '}
        <a
          href={`https://www.openstreetmap.org/?mlat=${map.latitude}&mlon=${map.longitude}#map=15/${map.latitude}/${map.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-700 underline dark:text-brand-300"
        >
          Open in OpenStreetMap
        </a>
      </p>
    </div>
  )
}
