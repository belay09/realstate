import { useEffect, useState } from 'react'
import { ButtonArrow } from '../components/ButtonArrow'
import { HomeDevelopersFromCms } from '../components/HomeDevelopersFromCms'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { usePageSeo } from '../hooks/usePageSeo'

const HERO_VIDEO = '/images/back.mp4'
const HERO_POSTER = '/images/hero-apartment.webp'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

export function HomePage() {
  const { t, messages } = useTranslation()
  const brand = messages.brand
  const reducedMotion = usePrefersReducedMotion()

  usePageSeo({
    title: t('pageTitles.home'),
    description: t('seo.homeDescription'),
    path: '/',
    includeSiteJsonLd: true,
  })

  return (
    <div className="text-left">
      <section
        className="home-hero relative isolate h-[min(85svh,48rem)] min-h-[40rem] overflow-hidden sm:h-[min(68svh,42rem)] sm:min-h-[34rem]"
        aria-label={brand.shortName}
      >
        {reducedMotion ? (
          <img
            src={HERO_POSTER}
            alt=""
            width={1600}
            height={900}
            decoding="async"
            fetchPriority="high"
            className="home-hero-video absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            className="home-hero-video absolute inset-0 h-full w-full object-cover"
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            aria-hidden
            ref={(el) => {
              if (!el) return
              el.muted = true
              el.defaultMuted = true
              el.setAttribute('playsinline', '')
              el.setAttribute('webkit-playsinline', '')
            }}
          />
        )}

        {/* Soft left/bottom scrim for type only */}
        <div className="home-hero-scrim pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-10 flex h-full flex-col justify-end pt-10 sm:pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8">
            <div className="home-hero-copy max-w-xl animate-hero-content-in lg:max-w-2xl">
              <p className="text-eyebrow text-brand-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">{brand.shortName}</p>
              <h1 className="mt-3 text-[2.125rem] font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:mt-4 sm:text-6xl sm:leading-[1.02] lg:text-7xl xl:text-[4.5rem]">
                {t('home.heroTitle')}
                <span className="text-brand-200"> {t('home.heroTitleAccent')}</span>
                {t('home.heroTitleEnd') ? ` ${t('home.heroTitleEnd')}` : ''}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] sm:mt-6 sm:text-lg">
                {t('home.heroMinimalBody')}
              </p>
              <p className="mt-4 text-sm font-medium text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:mt-5">
                {t('home.heroFreeLine')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
                <ButtonArrow to="#developers" variant="light" className="w-full justify-between sm:w-auto">
                  {t('home.browseDevelopers')}
                </ButtonArrow>
                <a href={SITE_CONTACT.telHref} className="btn-ghost-light w-full sm:w-auto">
                  {t('contact.call')}
                </a>
                <a
                  href={siteWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost-light w-full sm:w-auto"
                >
                  {t('contact.whatsapp')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeDevelopersFromCms />
    </div>
  )
}
