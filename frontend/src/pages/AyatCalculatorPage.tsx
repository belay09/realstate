import { useSearchParams } from 'react-router-dom'

import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import type { PropertyKind } from '../data/ayatCalculatorConfig'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'

function initialKindFromSearch(params: URLSearchParams): PropertyKind | null {
  const raw = params.get('kind') ?? params.get('type')
  if (raw === 'shop' || raw === 'commercial') return 'commercial'
  if (raw === 'apartment' || raw === 'home' || raw === 'residential') return 'residential'
  return null
}

export function AyatCalculatorPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  usePageTitle(t('pageTitles.calculator'))
  return <AyatPriceCalculator variant="page" initialKind={initialKindFromSearch(searchParams)} />
}
