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

type Props = {
  locationId: string
  listings: PublicListingSummary[]
  settings: LocationBuildingSettings | null | undefined
  title: string
  subtitle?: string | null
}

function sectionTitle(t: (key: string) => string, type: BuildingType) {
  if (type === 'mixed') return t('buildingType.mixedTitle')
  if (type === 'duplex') return t('buildingType.duplexTitle')
  return t('buildingType.flatTitle')
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
    return <LocationListingCards listings={listings} title={title} subtitle={subtitle} />
  }

  const enabled = settings.enabled_types ?? BUILDING_TYPE_ORDER
  const shopZoneId = settings.mixed?.shop_zone_id
  const firstTypeWithItems = enabled.find((type) => groups[type].length > 0)

  return (
    <div className="space-y-12">
      {enabled.map((type) => {
        const items = groups[type]
        if (items.length === 0) return null
        const mixed = type === 'mixed'
        const shopLink =
          mixed && shopZoneId
            ? `/calculator?kind=shop&zone=${encodeURIComponent(shopZoneId)}`
            : null

        return (
          <div key={type} className="space-y-4">
            <LocationListingCards
              listings={items}
              title={sectionTitle(t, type)}
              subtitle={sectionDescription(t, type, settings)}
              sectionId={type === firstTypeWithItems ? 'location-layouts' : undefined}
            />
            {shopLink ? (
              <p className="text-sm text-fg-muted">
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
              <ul className="text-xs text-fg-muted">
                {settings.tower_overrides.map((row) => {
                  const rules = floorRulesForTower(settings, row.tower_code)
                  return (
                    <li key={row.tower_code}>
                      {row.label || row.tower_code}: shops GF–{rules.retail_floor_max}, apartments
                      from floor {rules.residential_floor_min}
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        )
      })}

      {untagged.length > 0 ? (
        <LocationListingCards
          listings={untagged}
          title={t('buildingType.otherLayouts')}
          subtitle={t('buildingType.otherLayoutsHint')}
        />
      ) : null}
    </div>
  )
}
