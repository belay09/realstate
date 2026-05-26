export type Locale = 'en' | 'am'

export const LOCALE_STORAGE_KEY = 'belay-locale'

export const LOCALES: { id: Locale; label: string; nativeLabel: string }[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'am', label: 'Amharic', nativeLabel: 'አማርኛ' },
]
