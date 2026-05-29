import { BelayRoleSection } from '../components/BelayRoleSection'
import { ButtonArrow } from '../components/ButtonArrow'
import { HomeDevelopersSection } from '../components/HomeDevelopersSection'
import { PartnerMarquee } from '../components/PartnerMarquee'
import { SectionHeader } from '../components/SectionHeader'
import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { SITE_CONTACT } from '../content/siteContact'
import { usePageTitle } from '../hooks/usePageTitle'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85'

export function HomePage() {
  const { t, messages } = useTranslation()
  usePageTitle(t('pageTitles.home'))

  const heroStats = [
    { value: '2+', label: t('home.statDevelopers') },
    { value: String(messages.ayat.stats[0]?.value ?? '25+'), label: t('home.statExperience') },
    { value: 'You', label: t('home.statYou') },
  ]

  const credibilityStats = [
    ...messages.ayat.stats.map((stat) => ({ ...stat, partner: AYAT_PARTNER.brandName })),
    {
      value: SITE_CONTACT.phoneDisplay,
      label: t('contact.label'),
      partner: messages.brand.name,
    },
  ]

  return (
    <div className="text-left">
      <section className="relative min-h-[min(94vh,900px)] overflow-hidden bg-surface">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img
            src={HERO_IMAGE}
            alt=""
            className="hero-image-mask h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface via-surface/70 to-transparent lg:from-surface lg:via-surface/40 lg:to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent lg:hidden" />
        </div>

        <PartnerMarquee variant="hero-overlay" heroImage={HERO_IMAGE} />

        <div className="relative mx-auto flex min-h-[min(94vh,900px)] max-w-[90rem] flex-col justify-center px-4 pb-28 pt-24 sm:px-8 sm:pb-32 lg:pb-20">
          <div className="max-w-xl animate-fade-in lg:max-w-2xl">
            <p className="text-eyebrow">{t('home.heroEyebrow')}</p>
            <h1 className="text-hero mt-5">
              {t('home.heroTitle')}
              <span className="text-brand-700 dark:text-brand-400"> {t('home.heroTitleAccent')}</span>
              {t('home.heroTitleEnd') ? ` ${t('home.heroTitleEnd')}` : ''}
            </h1>
            <p className="text-lead mt-6 max-w-lg">
              {t('home.heroBody', {
                ayatBrand: AYAT_PARTNER.brandName,
                temerBrand: TEMER_PARTNER.brandName,
                belayNotAyat: t('home.belayNotAyat'),
              })}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonArrow to="/apartments">{t('home.exploreListings')}</ButtonArrow>
              <ButtonArrow to={`/apartments?company_slug=${TEMER_PARTNER.slug}`} variant="outline">
                {t('temer.browseTemer')}
              </ButtonArrow>
            </div>

            <ul className="mt-14 grid gap-8 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <li key={stat.label} className="stat-inline">
                  <p className="stat-inline-value">{stat.value}</p>
                  <p className="stat-inline-label">{stat.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] space-y-24 px-4 pb-24 pt-20 sm:px-8 sm:pt-28">
        <section className="space-y-6">
          <SectionHeader
            eyebrow={t('home.partnersEyebrow')}
            title={t('home.partnersTitle')}
            description={t('home.partnersDescription')}
            large
          />
          <HomeDevelopersSection />
        </section>

        <BelayRoleSection />

        <section className="rounded-3xl border border-border bg-surface-muted px-6 py-14 sm:px-12 sm:py-16">
          <SectionHeader
            align="center"
            eyebrow={t('home.credibilityEyebrow')}
            title={t('home.credibilityTitle')}
            description={t('home.credibilityDescription')}
            large
          />
          <ul className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {credibilityStats.map((stat) => (
              <li key={`${stat.partner}-${stat.label}`} className="surface px-5 py-10 text-center">
                <p className="stat-inline-value text-3xl sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-xs font-medium leading-snug text-fg-muted">{stat.label}</p>
                <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-brand-700 dark:text-brand-300">
                  {stat.partner}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
