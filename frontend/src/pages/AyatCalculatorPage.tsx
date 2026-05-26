import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'

export function AyatCalculatorPage() {
  const { t } = useTranslation()
  usePageTitle(t('pageTitles.calculator'))
  return <AyatPriceCalculator variant="page" />
}
