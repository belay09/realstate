import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '../context/LocaleContext'

const ROTATE_MS = 4500
const FADE_MS = 600
const PAUSE_AFTER_NAV_MS = 12000

type ListingCardImageCarouselProps = {
  urls: string[]
  alt?: string
  /** Stagger first slide so cards in a grid do not flip in sync */
  startOffset?: number
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      {direction === 'left' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19 8 12l7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
      )}
    </svg>
  )
}

export function ListingCardImageCarousel({
  urls,
  alt = '',
  startOffset = 0,
}: ListingCardImageCarouselProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const pauseUntilRef = useRef(0)

  const slides = useMemo(() => {
    const seen = new Set<string>()
    return urls
      .map((u) => u.trim())
      .filter((u) => {
        if (!u || seen.has(u)) return false
        seen.add(u)
        return true
      })
  }, [urls])

  const [active, setActive] = useState(() =>
    slides.length > 0 ? startOffset % slides.length : 0,
  )
  const [reduceMotion, setReduceMotion] = useState(false)
  const [inView, setInView] = useState(true)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pauseAutoPlay = useCallback(() => {
    pauseUntilRef.current = Date.now() + PAUSE_AFTER_NAV_MS
  }, [])

  const goTo = useCallback(
    (index: number) => {
      pauseAutoPlay()
      setActive(((index % slides.length) + slides.length) % slides.length)
    },
    [pauseAutoPlay, slides.length],
  )

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      goTo(active - 1)
    },
    [active, goTo],
  )

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      goTo(active + 1)
    },
    [active, goTo],
  )

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion || !inView || hovering) return
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return
      setActive((i) => (i + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [slides.length, reduceMotion, inView, hovering])

  if (slides.length === 0) return null

  if (slides.length === 1) {
    return (
      <img
        src={slides[0]}
        alt={alt}
        className="h-full w-full object-cover"
        loading="eager"
      />
    )
  }

  const navBtnClass =
    'absolute top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 opacity-90 sm:opacity-0 sm:group-hover/image:opacity-100 sm:group-focus-within/image:opacity-100'

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovering(false)
      }}
    >
      {slides.map((url, i) => {
        const isActive = i === active
        return (
          <img
            key={`${url}-${i}`}
            src={url}
            alt={isActive ? alt : ''}
            loading={i <= 1 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover transition-all ease-in-out ${
              isActive
                ? 'z-10 scale-100 opacity-100'
                : 'z-0 scale-[1.04] opacity-0'
            } ${isActive && !reduceMotion ? 'motion-safe:animate-card-image-ken' : ''}`}
            style={{ transitionDuration: `${FADE_MS}ms` }}
          />
        )
      })}

      <button
        type="button"
        className={`${navBtnClass} left-2`}
        onClick={goPrev}
        aria-label={t('listingCard.galleryPrev')}
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        className={`${navBtnClass} right-2`}
        onClick={goNext}
        aria-label={t('listingCard.galleryNext')}
      >
        <ChevronIcon direction="right" />
      </button>

      <div className="absolute bottom-3 left-0 right-0 z-30 flex items-center justify-center gap-1.5 px-12">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              goTo(i)
            }}
            aria-label={t('listingCard.galleryGoTo', { n: i + 1 })}
            aria-current={i === active ? 'true' : undefined}
            className={`rounded-full shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
              i === active ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      <span
        className="absolute bottom-3 right-3 z-30 rounded-md bg-black/50 px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-white backdrop-blur-sm"
        aria-live="polite"
      >
        {t('listingCard.galleryPosition', { current: active + 1, total: slides.length })}
      </span>
    </div>
  )
}
