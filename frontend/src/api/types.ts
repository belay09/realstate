export type Paginated<T> = {
  items: T[]
  total: number
}

export type Company = {
  id: string
  name: string
  slug: string
  phone: string | null
  website: string | null
  is_active: boolean
}

export type Project = {
  id: string
  company_id: string
  name: string
  slug: string
  city: string | null
  area: string | null
  status: string
}

export type Block = {
  id: string
  project_id: string
  name: string
  code: string | null
}

export type UnitType = {
  id: string
  company_id: string
  code: string
  name: string
  category: string
  bedrooms: number | null
}

export type PropertyUnit = {
  id: string
  block_id: string
  unit_type_id: string
  unit_number: string
  floor_number: number | null
  area_sqm: string | null
  status: string
}

export type PropertyListing = {
  id: string
  unit_id: string
  title: string
  slug: string
  description: string | null
  city: string | null
  area: string | null
  is_public: boolean
}

export type PublicListingSummary = {
  id: string
  title: string
  slug: string
  city: string | null
  area: string | null
  bedrooms: number | null
  unit_type_code: string
  unit_type_name: string
  company_name: string
  company_slug: string
  project_name: string
  project_slug: string
  primary_image_url: string | null
}

export type PublicListingDetail = PublicListingSummary & {
  description: string | null
  images: { url: string; sort_order: number; is_primary: boolean }[]
  unit_number: string
  floor_number: number | null
  area_sqm: string | null
  unit_status: string
}

export type PublicPricePreview = {
  final_price: string
  currency: string
  includes_vat: boolean
  pricing_version_name: string
  disclaimer: string
}

export type PublicPaymentPlanOption = {
  code: string
  name: string
}

export type PublicPaymentPreview = {
  plan_code: string
  plan_name: string
  final_price: string
  currency: string
  down_payment_amount: string
  items: { step_order: number; label: string; amount: string; due_type: string; due_date: string | null }[]
  disclaimer: string
}

export type Lead = {
  id: string
  listing_id: string | null
  unit_id: string | null
  company_id: string
  quote_id: string | null
  name: string
  phone: string
  email: string | null
  message: string | null
  source: string
  status: string
  created_at: string
  updated_at: string
}

export type PaymentPlan = {
  id: string
  company_id: string
  code: string
  name: string
  status: string
  effective_from: string | null
  effective_to: string | null
  steps: {
    id: string
    step_order: number
    trigger_type: string
    milestone_name: string | null
    percentage: string
  }[]
}

export type PriceCalculationBreakdown = {
  pricing_version_id: string
  pricing_version_name: string
  final_price: string
  base_price: string
  discount_amount: string
  currency: string
  includes_vat: boolean
  snapshot: Record<string, unknown>
}

export type InstallmentSchedule = {
  id: string
  unit_price_quote_id: string
  total_amount: string
  down_payment_amount: string
  items: { step_order: number; label: string; amount: string; due_type: string; due_date: string | null }[]
}

export type FullQuoteResponse = {
  pricing: PriceCalculationBreakdown
  quote: { id: string; unit_id: string; final_price: string; currency: string } | null
  installment_schedule: InstallmentSchedule | null
  commission: { id: string; amount: string; sales_channel?: string } | null
}
