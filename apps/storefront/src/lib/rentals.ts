import { sdk } from "@/lib/sdk"

export type ListingVariant = {
  id: string
  size_label: string
  measurements: Record<string, number>
  alterable: boolean
  alteration_notes?: string | null
}

export type ListingUnit = {
  id: string
  status: "active" | "maintenance" | "retired"
}

export type ListingVendor = {
  id: string
  name: string
  handle: string
  city?: string
  description?: string | null
  instagram_handle?: string | null
}

export type RentalListing = {
  id: string
  city: string
  base_amount: number
  base_days: number
  extra_day_amount?: number
  cleaning_fee_amount?: number
  deposit_amount: number
  late_fee_amount?: number
  lead_buffer_days?: number
  return_buffer_days?: number
  min_days: number
  max_days: number
  fulfillment_modes: ("pickup" | "courier")[]
  cancellation_policy: "flexible" | "standard" | "strict"
  occasion_tags?: string[] | null
  rating_avg: number
  rating_count: number
  fit_small_count?: number
  fit_true_count?: number
  fit_large_count?: number
  product: {
    id: string
    title: string
    handle: string
    description?: string | null
    thumbnail?: string | null
    images?: { url: string }[]
    vendor?: ListingVendor
  }
  variants: ListingVariant[]
  units: ListingUnit[]
  free_dates?: string[]
  available_unit_count?: number
}

type ListingsResponse = {
  listings: RentalListing[]
  count: number
  offset: number
  limit: number
}

export async function fetchListings({
  city,
  limit = 20,
  offset = 0,
}: {
  city?: string
  limit?: number
  offset?: number
} = {}) {
  const query: Record<string, string | number> = { limit, offset }

  if (city) {
    query.city = city
  }

  return sdk.client.fetch<ListingsResponse>("/store/rentals/listings", { query })
}

export async function searchListings({
  date,
  city,
  size,
  occasion,
  minPrice,
  maxPrice,
  limit = 24,
  offset = 0,
}: {
  date: string
  city?: string
  size?: string
  occasion?: string
  minPrice?: number
  maxPrice?: number
  limit?: number
  offset?: number
}) {
  const query: Record<string, string | number> = { date, limit, offset }

  if (city) query.city = city
  if (size) query.size = size
  if (occasion) query.occasion = occasion
  if (minPrice !== undefined) query.min_price = minPrice
  if (maxPrice !== undefined) query.max_price = maxPrice

  return sdk.client.fetch<ListingsResponse>("/store/rentals/search", { query })
}

export async function fetchListing(id: string) {
  return sdk.client.fetch<{ listing: RentalListing }>(`/store/rentals/listings/${id}`)
}

export function listingImages(listing: RentalListing) {
  const images = listing.product.images?.map((image) => image.url) ?? []

  if (images.length) {
    return images
  }

  return listing.product.thumbnail ? [listing.product.thumbnail] : []
}

export function formatPKR(amount: number) {
  return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`
}

export function primarySize(listing: RentalListing) {
  return listing.variants[0]?.size_label ?? "One size"
}
