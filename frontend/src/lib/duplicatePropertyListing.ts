import { api } from '../api/client'
import type {
  AdminLocationContent,
  AdminPropertyListingDetail,
  ListingMetadata,
  Paginated,
  Project,
  PropertyUnit,
} from '../api/types'

async function ensureProjectAndBlock(
  companyId: string,
  locationId: string,
  location: AdminLocationContent | undefined,
  city: string | null,
  area: string | null,
): Promise<{ projectId: string; blockId: string }> {
  const { data: projects } = await api.get<Paginated<Project>>('/admin/projects', {
    params: { company_id: companyId, limit: 100 },
  })
  const slug = locationId.trim()
  let project = projects.items.find((p) => p.slug === slug)
  if (!project) {
    const { data: created } = await api.post<Project>('/admin/projects', {
      company_id: companyId,
      name: location?.title ?? slug,
      slug,
      city: city?.trim() || 'Addis Ababa',
      area: area?.trim() || null,
      status: 'active',
    })
    project = created
  }

  const { data: blocks } = await api.get<Paginated<{ id: string }>>('/admin/blocks', {
    params: { project_id: project.id, limit: 50 },
  })
  let blockId = blocks.items[0]?.id
  if (!blockId) {
    const { data: block } = await api.post<{ id: string }>('/admin/blocks', {
      project_id: project.id,
      name: 'Default',
      code: 'DEF',
      total_floors: 20,
    })
    blockId = block.id
  }
  return { projectId: project.id, blockId }
}

export async function duplicatePropertyListing(opts: {
  companyId: string
  source: AdminPropertyListingDetail
  sourceUnit: PropertyUnit
  title: string
  locationKind: 'apartment' | 'shop'
  locationId: string
  locationPages: AdminLocationContent[]
  city: string | null
  area: string | null
  description: string | null
  listingMetadata: ListingMetadata | null
  floorNumber: number | null
  unitNumber: string
  isPublic: boolean
  copyImages: boolean
}): Promise<string> {
  const loc = opts.locationPages.find((row) => row.location_id === opts.locationId)
  const targetCity = 'Addis Ababa'
  const targetArea = loc?.subtitle?.trim() || loc?.title?.trim() || null
  const { blockId } = await ensureProjectAndBlock(
    opts.companyId,
    opts.locationId,
    loc,
    targetCity,
    targetArea,
  )

  const number =
    opts.unitNumber.trim() ||
    (opts.floorNumber != null ? String(opts.floorNumber) : `copy-${Date.now().toString(36).slice(-6)}`)

  const { data: unit } = await api.post<PropertyUnit>('/admin/units', {
    block_id: blockId,
    unit_type_id: opts.sourceUnit.unit_type_id,
    unit_number: number,
    floor_number: opts.floorNumber,
    status: 'available',
  })

  const { data: listing } = await api.post<{ id: string }>('/admin/listings', {
    unit_id: unit.id,
    title: opts.title.trim(),
    description: opts.description,
    city: targetCity,
    area: targetArea,
    is_public: opts.isPublic,
    listing_metadata: opts.listingMetadata,
    location_kind: opts.locationKind,
    location_id: opts.locationId.trim(),
  })

  if (opts.copyImages && opts.source.images.length > 0) {
    for (const [index, image] of opts.source.images.entries()) {
      await api.post(`/admin/listings/${listing.id}/images`, {
        url: image.url,
        is_primary: image.is_primary,
        sort_order: index,
      })
    }
  }

  return listing.id
}
