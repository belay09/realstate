import { Link } from 'react-router-dom'

import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { PartnerLogo } from './PartnerLogo'

const PARTNERS = [AYAT_PARTNER, TEMER_PARTNER] as const

type PartnerMarqueeProps = {
  variant?: 'default' | 'hero-overlay'
  heroImage?: string
}

function HeroMarqueeItem({ slug, name, to }: { slug: string; name: string; to: string }) {
  const temerWide = slug === TEMER_PARTNER.slug
  const isAyat = slug === AYAT_PARTNER.slug

  return (
    <Link
      to={to}
      className={`hero-marquee-item group flex shrink-0 items-center gap-4 rounded-2xl border px-5 py-3.5 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.35)] sm:gap-5 sm:px-6 sm:py-4 ${
        isAyat
          ? 'border-red-900/15 bg-white/95 hover:border-red-900/30'
          : 'border-emerald-800/15 bg-white/95 hover:border-emerald-800/30'
      }`}
    >
      <PartnerLogo
        companySlug={slug}
        size="hero"
        className={`border-slate-200/80 bg-white shadow-lg ring-2 ring-white transition duration-300 group-hover:scale-105 group-hover:shadow-xl ${
          isAyat ? 'group-hover:ring-red-100' : 'group-hover:ring-emerald-100'
        } ${temerWide ? 'h-24 w-32 object-contain sm:h-28 sm:w-36' : 'h-24 w-24 sm:h-28 sm:w-28'}`}
      />
      <span className="whitespace-nowrap text-sm font-bold tracking-tight text-slate-900 sm:text-base">
        {name}
      </span>
    </Link>
  )
}

function InlinePartnerChip({ slug, name, to }: { slug: string; name: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex shrink-0 items-center gap-3 rounded-2xl border border-white/30 bg-white/25 px-5 py-3 backdrop-blur-md transition hover:bg-white/40"
    >
      <PartnerLogo companySlug={slug} size="xl" className="border-white/50 bg-white shadow-md" />
      <span className="whitespace-nowrap text-sm font-semibold text-slate-800">{name}</span>
    </Link>
  )
}

function HeroPartnerStrip({ heroImage, tagline }: { heroImage?: string; tagline: string }) {
  const items = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((p, i) => (
    <HeroMarqueeItem
      key={`${p.slug}-${i}`}
      slug={p.slug}
      name={p.brandName}
      to={`/apartments?company_slug=${p.slug}`}
    />
  ))

  return (
    <div className="hero-partner-strip pointer-events-auto overflow-hidden rounded-2xl sm:rounded-3xl">
      <div className="hero-partner-strip-glow" aria-hidden />
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-right-bottom scale-110 blur-2xl saturate-125"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-sky-50/85 to-cyan-100/80 backdrop-blur-2xl dark:from-slate-900/90 dark:via-slate-900/85 dark:to-sky-950/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.18),transparent_55%)]" aria-hidden />

      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-center gap-2.5">
          <span className="hero-partner-pulse h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
          <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.24em] text-slate-700 sm:text-xs dark:text-slate-200">
            {tagline}
          </p>
          <span className="hero-partner-pulse h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
        </div>

        <div className="marquee-mask hero-marquee-mask mt-4 overflow-hidden sm:mt-5">
          <div className="marquee-track marquee-track-hero flex w-max items-center gap-6 sm:gap-8">
            {items}
            {items}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PartnerMarquee({ variant = 'default', heroImage }: PartnerMarqueeProps) {
  const { t } = useTranslation()
  const tagline = t('home.marqueeTagline')

  if (variant === 'hero-overlay') {
    return (
      <>
        {/* Desktop: bottom-right over the hero image */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-full lg:block lg:w-[58%]">
          <div className="pointer-events-auto absolute right-6 bottom-24 w-[min(100%,32rem)] xl:right-10 xl:bottom-28 xl:w-[36rem]">
            <HeroPartnerStrip heroImage={heroImage} tagline={tagline} />
          </div>
        </div>

        {/* Mobile / tablet: bottom-right over the hero image */}
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 px-4 lg:hidden">
          <div className="pointer-events-auto ml-auto w-full max-w-lg sm:max-w-xl">
            <HeroPartnerStrip heroImage={heroImage} tagline={tagline} />
          </div>
        </div>
      </>
    )
  }

  const items = PARTNERS.map((p) => (
    <InlinePartnerChip
      key={p.slug}
      slug={p.slug}
      name={p.brandName}
      to={`/apartments?company_slug=${p.slug}`}
    />
  ))

  const track = (
    <>
      {items}
      {items}
      {items}
      {items}
    </>
  )

  return (
    <div className="partner-marquee border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:gap-10 sm:px-8">
        <p className="shrink-0 text-[0.65rem] font-semibold uppercase leading-relaxed tracking-[0.2em] text-slate-400 sm:max-w-[15rem]">
          {tagline}
        </p>
        <div className="marquee-mask relative min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-8">{track}</div>
        </div>
      </div>
    </div>
  )
}
