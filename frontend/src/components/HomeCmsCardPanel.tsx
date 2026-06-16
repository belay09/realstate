import { Link } from 'react-router-dom'

import type { PublicHomeCard } from '../api/types'
import { ButtonArrow } from './ButtonArrow'

const FALLBACK_IMAGES: Record<string, string> = {
  residential: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
  commercial: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
}

type HomeCmsCardPanelProps = {
  card: PublicHomeCard
  reverse?: boolean
  index?: number
}

export function HomeCmsCardPanel({ card, reverse = false, index = 0 }: HomeCmsCardPanelProps) {
  const image = card.image_url?.trim() || FALLBACK_IMAGES[card.card_key] || FALLBACK_IMAGES.residential
  const tag = card.tag?.trim()
  const to = card.to_path.startsWith('/') ? card.to_path : `/${card.to_path}`

  return (
    <article
      className="developer-showcase group relative overflow-hidden border-t border-border py-16 sm:py-20 lg:py-24"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div
        className={`pointer-events-none absolute -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-brand-500/10 via-transparent to-brand-700/5 blur-3xl ${
          reverse ? '-left-24' : '-right-24'
        }`}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-8">
        <div
          className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          <div className="min-w-0">
            <div className="mb-6 h-1 w-12 rounded-full bg-brand-600/70" aria-hidden />
            {tag ? <p className="section-eyebrow">{tag}</p> : null}
            <h2 className="text-h1 mt-4 leading-tight">{card.title}</h2>
            <p className="text-lead mt-6 max-w-xl">{card.description}</p>
            <div className="mt-10">
              <ButtonArrow to={to}>{tag || card.title}</ButtonArrow>
            </div>
          </div>

          <Link
            to={to}
            className="developer-showcase-visual relative block overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
          >
            <div className="aspect-[4/5] overflow-hidden bg-surface-muted sm:aspect-[5/6]">
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.06]"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              {tag ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{tag}</p>
              ) : null}
              <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{card.title}</p>
            </div>
          </Link>
        </div>
      </div>
    </article>
  )
}
