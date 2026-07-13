import { ButtonArrow } from '../components/ButtonArrow'
import { HomeDevelopersFromCms } from '../components/HomeDevelopersFromCms'
import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'
import { usePageSeo } from '../hooks/usePageSeo'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85'

export function HomePage() {
  const { t } = useTranslation()
  usePageSeo({
    title: t('pageTitles.home'),
    description: t('seo.homeDescription'),
    path: '/',
    includeSiteJsonLd: true,
  })

  return (
    <div className="text-left">
      <section className="home-hero relative min-h-[min(62vh,520px)] overflow-hidden bg-surface sm:min-h-[min(88vh,820px)]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img
            src={HERO_IMAGE}
            alt=""
            className="hero-image-mask animate-hero-ken-burns h-full w-full object-cover object-center"
          />
          <div className="home-hero-fade-x pointer-events-none absolute inset-0" />
          <div className="home-hero-fade-y pointer-events-none absolute inset-0 lg:hidden" />
          <div className="home-hero-dim pointer-events-none absolute inset-0" aria-hidden />
        </div>

        <div className="relative mx-auto flex min-h-[min(62vh,520px)] max-w-[90rem] flex-col justify-center px-4 pb-14 pt-14 sm:min-h-[min(88vh,820px)] sm:px-8 sm:pb-28 sm:pt-24 lg:pb-20">
          <div className="max-w-xl animate-hero-content-in lg:max-w-2xl">
            <p className="text-eyebrow">{t('home.heroEyebrow')}</p>
            <h1 className="text-hero mt-4 sm:mt-5">
              {t('home.heroTitle')}
              <span className="text-brand-700 dark:text-brand-400"> {t('home.heroTitleAccent')}</span>
              {t('home.heroTitleEnd') ? ` ${t('home.heroTitleEnd')}` : ''}
            </h1>
            <p className="text-lead mt-4 max-w-lg sm:mt-6">{t('home.heroMinimalBody')}</p>
            <p className="mt-4 text-sm font-medium text-fg-muted sm:mt-5">{t('home.heroFreeLine')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <ButtonArrow to="#developers" className="w-full justify-between sm:w-auto">
                {t('home.browseDevelopers')}
              </ButtonArrow>
              <a href={SITE_CONTACT.telHref} className="btn-secondary w-full sm:w-auto">
                {t('contact.call')}
              </a>
              <a
                href={siteWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full sm:w-auto"
              >
                {t('contact.whatsapp')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <HomeDevelopersFromCms />
    </div>
  )
}
