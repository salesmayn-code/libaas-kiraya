import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const LISTING_FIELDS = [
  "id",
  "city",
  "base_amount",
  "deposit_amount",
  "base_days",
  "min_days",
  "max_days",
  "fulfillment_modes",
  "cancellation_policy",
  "occasion_tags",
  "rating_avg",
  "rating_count",
  "product.id",
  "product.title",
  "product.handle",
  "product.description",
  "product.thumbnail",
  "product.images.url",
  "product.vendor.id",
  "product.vendor.name",
  "product.vendor.handle",
  "variants.id",
  "variants.size_label",
  "variants.measurements",
  "variants.alterable",
  "units.id",
  "units.status",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 60)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const city = typeof req.query.city === "string" ? req.query.city : undefined

  const filters: Record<string, unknown> = { status: "active" }

  if (city) {
    filters.city = city
  }

  const { data: listings, metadata } = await query.graph({
    entity: "rental_listing",
    fields: LISTING_FIELDS,
    filters,
    pagination: { skip: offset, take: limit },
  })

  res.json({
    listings,
    count: metadata?.count ?? listings.length,
    offset,
    limit,
  })
}
