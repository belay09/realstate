import { SITE_CONTACT, siteWhatsAppHref } from '../content/siteContact'
import { useTranslation } from '../context/LocaleContext'

export function HomeAdvisorySection() {
  const { t } = useTranslation()

  const points = [
    {
      title: t('home.advisoryPoint1Title'),
      text: t('home.advisoryPoint1Text'),
      icon: '◎',
    },
    {
      title: t('home.advisoryPoint2Title'),
      text: t('home.advisoryPoint2Text'),
      icon: '◇',
    },
    {
      title: t('home.advisoryPoint3Title'),
      text: t('home.advisoryPoint3Text'),
      icon: '○',
    },
  ]

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-brand-500/25 bg-gradient-to-br from-brand-50 via-surface to-surface p-8 shadow-[0_24px_60px_-28px_rgba(14,165,233,0.25)] dark:from-brand-950/40 dark:via-surface dark:to-surface sm:p-10 lg:p-12">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="section-eyebrow">{t('home.advisoryEyebrow')}</p>
            <h2 className="section-title mt-2">{t('home.advisoryTitle')}</h2>
            <p className="mt-4 text-body">{t('home.advisorySummary')}</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand-900/20">
            {t('home.freeBadge')}
          </span>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {points.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm dark:bg-surface-muted/80"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                {item.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-fg">{item.title}</h3>
              <p className="mt-2 text-body-sm">{item.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={SITE_CONTACT.telHref} className="btn-primary">
            {t('home.advisoryCta')}
          </a>
          <a
            href={siteWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            {t('contact.whatsapp')}
          </a>
          <p className="text-sm font-medium text-fg-muted">{t('home.advisoryCtaHint')}</p>
        </div>
      </div>
    </section>
  )
}
