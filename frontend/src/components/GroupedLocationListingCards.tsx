import { Link } from 'react-router-dom'

import type { LocationBuildingSettings, PublicListingSummary } from '../api/types'
import { useTranslation } from '../context/LocaleContext'
import {
  BUILDING_TYPE_ORDER,
  floorRulesForTower,
  groupListingsByBuildingType,
  hasBuildingTypeContent,
  resolveBuildingSettings,
  type BuildingType,
} from '../lib/buildingTypes'
import { LocationListingCards } from './LocationListingCards'
import { ScrollReveal } from './ScrollReveal'

type Props = {
  locationId: string
  listings: PublicListingSummary[]
  settings: LocationBuildingSettings | null | undefined
  title: string
  subtitle?: string | null
}

const SECTION_ACCENT: Record<BuildingType, string> = {
  mixed: 'border-violet-500 bg-violet-500/5',
  duplex: 'border-sky-500 bg-sky-500/5',
  flat: 'border-emerald-500 bg-emerald-500/5',
}

function sectionTitle(t: (key: string) => string, type: BuildingType) {
  if (type === 'mixed') return t('buildingType.mixedTitle')
  if (type === 'duplex') return t('buildingType.duplexTitle')
  return t('buildingType.flatTitle')
}

function sectionEyebrow(t: (key: string) => string, type: BuildingType) {
  if (type === 'mixed') return t('layoutCard.sectionEyebrowMixed')
  if (type === 'duplex') return t('layoutCard.sectionEyebrowDuplex')
  return t('layoutCard.sectionEyebrowFlat')
}

function sectionDescription(
  t: (key: string, vars?: Record<string, string | number>) => string,
  type: BuildingType,
  settings: LocationBuildingSettings,
) {
  if (type !== 'mixed') {
    if (type === 'duplex') return t('buildingType.duplexIntro')
    return t('buildingType.flatIntro')
  }
  const mixed = settings.mixed
  if (!mixed) return t('buildingType.mixedIntroFallback')
  return t('buildingType.mixedIntro', {
    retailMax: mixed.retail_floor_max,
    residentialMin: mixed.residential_floor_min,
  })
}

export function GroupedLocationListingCards({
  locationId,
  listings,
  settings: rawSettings,
  title,
  subtitle,
}: Props) {
  const { t } = useTranslation()
  const settings = resolveBuildingSettings(locationId, rawSettings)
  const { groups, untagged } = groupListingsByBuildingType(listings)

  if (!hasBuildingTypeContent(settings, groups)) {
    return (
      <LocationListingCards
        listings={listings}
        title={title}
        subtitle={subtitle ?? t('projectBrowse.chooseLayout')}
        eyebrow={t('layoutCard.sectionEyebrowAll')}
      />
    )
  }

  const enabled = settings.enabled_types ?? BUILDING_TYPE_ORDER
  const shopZoneId = settings.mixed?.shop_zone_id
  const firstTypeWithItems = enabled.find((type) => groups[type].length > 0)

  return (
    <div className="space-y-14 md:space-y-16">
      <ScrollReveal animation="up">
        <p className="mx-auto max-w-3xl text-center text-body-sm leading-relaxed text-fg-muted">
          {subtitle ?? t('projectBrowse.chooseLayout')}
        </p>
      </ScrollReveal>

      {enabled.map((type) => {
        const items = groups[type]
        if (items.length === 0) return null
        const mixed = type === 'mixed'
        const shopLink =
          mixed && shopZoneId
            ? `/calculator?kind=shop&zone=${encodeURIComponent(shopZoneId)}`
            : null

        return (
          <div
            key={type}
            className={`scroll-mt-28 rounded-3xl border-l-4 px-4 py-2 md:px-6 ${SECTION_ACCENT[type]}`}
          >
            <LocationListingCards
              listings={items}
              title={sectionTitle(t, type)}
              subtitle={sectionDescription(t, type, settings)}
              eyebrow={sectionEyebrow(t, type)}
              sectionId={type === firstTypeWithItems ? 'location-layouts' : undefined}
            />
            {shopLink ? (
              <p className="mx-auto -mt-2 max-w-4xl text-sm text-fg-muted">
                {t('buildingType.shopFloorsHint')}{' '}
                <Link
                  to={shopLink}
                  className="font-semibold text-brand-700 underline dark:text-brand-300"
                >
                  {t('buildingType.shopCalculatorLink')}
                </Link>
              </p>
            ) : null}
            {mixed && settings.tower_overrides.length > 0 ? (
              <ul className="mx-auto mt-3 max-w-4xl space-y-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm text-fg-muted">
                {settings.tower_overrides.map((row) => {
                  const rules = floorRulesForTower(settings, row.tower_code)
                  return (
                    <li key={row.tower_code}>
                      <strong className="text-fg">{row.label || row.tower_code}:</strong> shops
                      ground–{rules.retail_floor_max}, apartments from floor{' '}
                      {rules.residential_floor_min}
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        )
      })}

      {untagged.length > 0 ? (
        <div className="rounded-3xl border-l-4 border-stone-400 bg-stone-500/5 px-4 py-2 md:px-6">
          <LocationListingCards
            listings={untagged}
            title={t('buildingType.otherLayouts')}
            subtitle={t('buildingType.otherLayoutsHint')}
            eyebrow={t('layoutCard.sectionEyebrowOther')}
          />
        </div>
      ) : null}
    </div>
  )
}
