import { Link } from 'react-router-dom'

import { BelayRoleSection } from '../components/BelayRoleSection'
import { PartnerAyatSection } from '../components/PartnerAyatSection'
import { SectionHeader } from '../components/SectionHeader'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER } from '../content/partners'
import { useAdminEntryPath } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=85'

const CATEGORY_CARD_KEYS = ['residential', 'choice'] as const

const CATEGORY_IMAGES = {
  residential: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
  choice: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80',
} as const

export function HomePage() {
  const { t, messages } = useTranslation()
  usePageTitle(t('pageTitles.home'))
  const adminPath = useAdminEntryPath()

  const categoryCards = CATEGORY_CARD_KEYS.map((key) => ({
    key,
    title:
      key === 'residential' ? t('home.cardResidentialTitle') : t('home.cardChoiceTitle'),
    description:
      key === 'residential'
        ? t('home.cardResidentialDescription')
        : t('home.cardChoiceDescription'),
    tag: key === 'residential' ? t('home.cardTagHomes') : t('home.cardTagOpen'),
    image: CATEGORY_IMAGES[key],
  }))

  const heroStats = [
    { value: AYAT_PARTNER.yearsEstablished, label: t('home.statYears') },
    { value: 'Multi', label: t('home.statMulti') },
    { value: 'You', label: t('home.statYou') },
  ]

  return (
    <div className="text-left">
      <section className="relative min-h-[min(88vh,820px)] overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-brand-950/85 to-brand-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="relative mx-auto flex min-h-[min(88vh,820px)] max-w-[90rem] flex-col justify-center px-4 pb-36 pt-28 sm:px-8 sm:pb-40">
          <p className="animate-fade-in text-eyebrow text-brand-200">{t('home.heroEyebrow')}</p>
          <h1 className="mt-4 max-w-3xl text-display text-white">
            {t('home.heroTitle')}
            <span className="text-brand-300"> {t('home.heroTitleAccent')}</span> {t('home.heroTitleEnd')}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-100/90 sm:text-lg">
            {t('home.heroBody', {
              ayatBrand: AYAT_PARTNER.brandName,
              years: AYAT_PARTNER.yearsEstablished,
              belayNotAyat: t('home.belayNotAyat'),
            })}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/listings" className="btn-accent">
              {t('home.exploreListings')}
            </Link>
            <Link
              to={`/listings?company_slug=${AYAT_PARTNER.slug}`}
              className="btn-ghost-light"
            >
              {t('home.ayatHomes')}
            </Link>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-20 max-w-[90rem] px-4 sm:-mt-24 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div key={stat.label} className="surface flex items-center gap-4 px-5 py-5 sm:px-6">
              <span className="text-stat shrink-0">{stat.value}</span>
              <span className="text-body-sm font-medium leading-snug">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] space-y-20 px-4 pb-20 pt-14 sm:px-8 sm:pt-16">
        <PartnerAyatSection />

        <section>
          <SectionHeader
            eyebrow={t('home.inventoryEyebrow')}
            title={t('home.inventoryTitle')}
            description={t('home.inventoryDescription')}
          />
          <ul className="mt-10 grid gap-6 lg:grid-cols-2">
            {categoryCards.map((card) => (
              <li key={card.key}>
                <Link
                  to="/listings"
                  className="group surface block overflow-hidden transition hover:shadow-[0_20px_40px_-12px_rgba(2,132,199,0.2)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={card.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="badge-sale absolute left-4 top-4">{card.tag}</span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <h3 className="text-h3">{card.title}</h3>
                    <p className="mt-2 text-body-sm">{card.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-300">
                      {t('home.viewListings')}
                      <span className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <BelayRoleSection />

        <section className="surface-muted px-6 py-12 sm:px-10 sm:py-14">
          <SectionHeader
            align="center"
            eyebrow={t('home.credibilityEyebrow')}
            title={t('home.credibilityTitle')}
            description={t('home.credibilityDescription')}
          />
          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {messages.ayat.stats.map((stat) => (
              <li key={stat.label} className="surface px-4 py-8 text-center">
                <p className="text-stat">{stat.value}</p>
                <p className="mt-2 text-xs font-medium leading-snug text-fg-muted">{stat.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 px-8 py-12 text-center sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
          <h2 className="relative text-h2 text-white">{t('home.ctaTitle')}</h2>
          <p className="relative mx-auto mt-3 max-w-md text-body-sm text-slate-200">
            {t('home.ctaDescription')}
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/listings" className="btn-accent">
              {t('home.browseListings')}
            </Link>
            <Link to={adminPath} className="btn-ghost-light">
              {t('home.staffLogin')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
