import type { LocationBuildingSettings, TowerFloorOverride } from '../../api/types'
import { defaultBuildingSettings } from '../../lib/buildingTypes'

type ShopZoneOption = { value: string; label: string }

type Props = {
  locationId: string
  settings: LocationBuildingSettings
  shopZoneOptions: ShopZoneOption[]
  onChange: (settings: LocationBuildingSettings) => void
}

const BUILDING_TYPES = [
  { id: 'mixed' as const, label: 'Mixed use (shop + residential)' },
  { id: 'duplex' as const, label: 'Duplex' },
  { id: 'flat' as const, label: 'Flat (residential only)' },
]

function toggleType(
  enabled: LocationBuildingSettings['enabled_types'],
  type: 'mixed' | 'duplex' | 'flat',
): LocationBuildingSettings['enabled_types'] {
  return enabled.includes(type) ? enabled.filter((t) => t !== type) : [...enabled, type]
}

export function LocationBuildingSettingsForm({
  locationId,
  settings,
  shopZoneOptions,
  onChange,
}: Props) {
  const mixed = settings.mixed ?? defaultBuildingSettings(locationId).mixed!
  const mixedEnabled = settings.enabled_types.includes('mixed')

  const updateOverride = (index: number, patch: Partial<TowerFloorOverride>) => {
    const tower_overrides = settings.tower_overrides.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    )
    onChange({ ...settings, tower_overrides })
  }

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/40 md:col-span-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Building types</p>
        <p className="mt-1 text-xs text-stone-500">
          Choose which building types appear on the public location page. Assign each property under{' '}
          <strong>Admin → Properties</strong>.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {BUILDING_TYPES.map(({ id, label }) => (
          <label key={id} className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.enabled_types.includes(id)}
              onChange={() =>
                onChange({
                  ...settings,
                  enabled_types: toggleType(settings.enabled_types, id),
                })
              }
            />
            {label}
          </label>
        ))}
      </div>

      {mixedEnabled ? (
        <div className="space-y-3 rounded border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Mixed-use floor rules (default)
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Shop floors up to
              <input
                type="number"
                min={0}
                max={50}
                className="input mt-1 w-full"
                value={mixed.retail_floor_max}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    mixed: { ...mixed, retail_floor_max: Number(e.target.value) || 0 },
                  })
                }
              />
            </label>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Apartments from floor
              <input
                type="number"
                min={1}
                max={50}
                className="input mt-1 w-full"
                value={mixed.residential_floor_min}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    mixed: { ...mixed, residential_floor_min: Number(e.target.value) || 1 },
                  })
                }
              />
            </label>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Shop calculator zone
              <select
                className="input mt-1 w-full"
                value={mixed.shop_zone_id ?? ''}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    mixed: { ...mixed, shop_zone_id: e.target.value || null },
                  })
                }
              >
                <option value="">- select shop zone -</option>
                {shopZoneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-stone-500">
            Example: shops on GF–{mixed.retail_floor_max}, apartments from floor{' '}
            {mixed.residential_floor_min}. Retail listings link to the shop price calculator.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Per-tower overrides (optional)
              </p>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() =>
                  onChange({
                    ...settings,
                    tower_overrides: [
                      ...settings.tower_overrides,
                      {
                        tower_code: '',
                        label: '',
                        retail_floor_max: mixed.retail_floor_max,
                        residential_floor_min: mixed.residential_floor_min,
                      },
                    ],
                  })
                }
              >
                Add tower
              </button>
            </div>
            {settings.tower_overrides.length === 0 ? (
              <p className="text-xs text-stone-500">Use when one tower has different floor split.</p>
            ) : null}
            {settings.tower_overrides.map((row, index) => (
              <div key={index} className="grid gap-2 rounded border border-stone-200 p-2 sm:grid-cols-5 dark:border-stone-700">
                <input
                  className="input"
                  placeholder="Tower code"
                  value={row.tower_code}
                  onChange={(e) => updateOverride(index, { tower_code: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Label (optional)"
                  value={row.label ?? ''}
                  onChange={(e) => updateOverride(index, { label: e.target.value || null })}
                />
                <input
                  type="number"
                  min={0}
                  className="input"
                  placeholder="Shop max floor"
                  value={row.retail_floor_max}
                  onChange={(e) =>
                    updateOverride(index, { retail_floor_max: Number(e.target.value) || 0 })
                  }
                />
                <input
                  type="number"
                  min={1}
                  className="input"
                  placeholder="Apt from floor"
                  value={row.residential_floor_min}
                  onChange={(e) =>
                    updateOverride(index, { residential_floor_min: Number(e.target.value) || 1 })
                  }
                />
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() =>
                    onChange({
                      ...settings,
                      tower_overrides: settings.tower_overrides.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
