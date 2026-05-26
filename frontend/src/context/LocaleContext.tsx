import * as React from 'react'

import { applyLocale, getStoredLocale } from '../lib/locale'
import { am } from '../i18n/locales/am'
import { en } from '../i18n/locales/en'
import { createTranslator, type Translator } from '../i18n/translate'
import type { Messages } from '../i18n/locales/en'
import type { Locale } from '../i18n/types'
import { LOCALE_STORAGE_KEY } from '../i18n/types'

export type { Locale }

const catalogs: Record<Locale, Messages> = { en, am }

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translator
  messages: Messages
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(getStoredLocale)

  const messages = catalogs[locale]
  const t = React.useMemo(() => createTranslator(messages), [messages])

  React.useEffect(() => {
    applyLocale(locale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const value = React.useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}

export function useTranslation() {
  const { t, locale, setLocale, messages } = useLocale()
  return { t, locale, setLocale, messages }
}
