import { useEffect } from 'react'

import { useTranslation } from '../context/LocaleContext'

export function usePageTitle(title: string) {
  const { messages } = useTranslation()

  useEffect(() => {
    const prev = document.title
    const brand = messages.brand.name
    document.title = title ? `${title} · ${brand}` : brand
    return () => {
      document.title = prev
    }
  }, [title, messages.brand.name])
}
