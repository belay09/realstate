import { useTranslation } from '../context/LocaleContext'
import { AYAT_PARTNER, TEMER_PARTNER } from '../content/partners'
import { DeveloperShowcasePanel } from './DeveloperShowcasePanel'

const SHOWCASE_IMAGES = {
  ayat: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
  temer: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
} as const

export function HomeDevelopersSection() {
  const { t, messages } = useTranslation()

  return (
    <section className="overflow-hidden">
      <DeveloperShowcasePanel
        index={0}
        partnerSlug={AYAT_PARTNER.slug}
        eyebrow={t('ayat.featuredEyebrow')}
        title={t('home.cardAyatTitle')}
        description={t('ayat.body', { reputation: t('ayat.reputation') })}
        highlights={messages.ayat.highlights}
        image={SHOWCASE_IMAGES.ayat}
        imageTitle={t('home.cardAyatTitle')}
        browseTo={`/apartments?company_slug=${AYAT_PARTNER.slug}`}
        browseLabel={t('ayat.browseAyat')}
        secondaryTo="/shops"
        secondaryLabel={t('home.cardCommercialTitle')}
        officialHref={AYAT_PARTNER.website}
        officialLabel={t('ayat.officialSite')}
      />
      <DeveloperShowcasePanel
        index={1}
        reverse
        partnerSlug={TEMER_PARTNER.slug}
        eyebrow={t('temer.featuredEyebrow')}
        title={t('home.cardTemerTitle')}
        description={t('temer.body')}
        highlights={messages.temer.highlights}
        image={SHOWCASE_IMAGES.temer}
        imageTitle={t('home.cardTemerTitle')}
        browseTo={`/apartments?company_slug=${TEMER_PARTNER.slug}`}
        browseLabel={t('temer.browseTemer')}
        officialHref={TEMER_PARTNER.website}
        officialLabel={t('temer.officialSite')}
      />
    </section>
  )
}
