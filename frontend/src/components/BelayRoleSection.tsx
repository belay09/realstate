import { useTranslation } from '../context/LocaleContext'

export function BelayRoleSection() {
  const { t } = useTranslation()

  const features = [
    { title: t('belayRole.feature1Title'), text: t('belayRole.feature1Text'), icon: '◆' },
    { title: t('belayRole.feature2Title'), text: t('belayRole.feature2Text'), icon: '◇' },
    { title: t('belayRole.feature3Title'), text: t('belayRole.feature3Text'), icon: '○' },
  ]

  return (
    <section className="surface p-8 sm:p-10 lg:p-12">
      <p className="section-eyebrow">{t('belayRole.eyebrow')}</p>
      <h2 className="section-title mt-2 max-w-2xl">{t('belayRole.title')}</h2>
      <p className="mt-4 max-w-3xl text-body">{t('belayRole.summary')}</p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-3">
        {features.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-border bg-surface-muted p-6 transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              {item.icon}
            </span>
            <h3 className="mt-4 text-base font-semibold text-fg">{item.title}</h3>
            <p className="mt-2 text-body-sm">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
