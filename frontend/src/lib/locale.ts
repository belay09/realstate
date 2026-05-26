import type { Locale } from '../i18n/types'
import { LOCALE_STORAGE_KEY } from '../i18n/types'

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    return stored === 'am' ? 'am' : 'en'
  } catch {
    return 'en'
  }
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale === 'am' ? 'am' : 'en'
  document.documentElement.classList.toggle('locale-am', locale === 'am')
}
