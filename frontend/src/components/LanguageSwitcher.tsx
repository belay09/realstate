import { LOCALES } from '../i18n/types'
import { useTranslation } from '../context/LocaleContext'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div
      className={`inline-flex rounded-full border border-border bg-surface p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t('language.switch')}
    >
      {LOCALES.map(({ id, nativeLabel }) => (
        <button
          key={id}
          type="button"
          onClick={() => setLocale(id)}
          className={`rounded-full px-2.5 py-1.5 transition sm:px-3 ${
            locale === id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-fg-muted hover:text-brand-700 dark:hover:text-brand-300'
          }`}
          aria-pressed={locale === id}
          lang={id}
        >
          {nativeLabel}
        </button>
      ))}
    </div>
  )
}
