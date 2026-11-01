import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const status = typeof req.query.status === "string" ? req.query.status : undefined
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const filters: Record<string, unknown> = {}

  if (status) filters.status = status

  const { data: disputes, metadata } = await query.graph({
    entity: "rental_dispute",
    fields: [
      "*",
      "inspection.*",
      "inspection.booking.id",
      "inspection.booking.status",
      "inspection.booking.rental_start",
      "inspection.booking.rental_end",
      "inspection.booking.deposit_amount",
      "inspection.booking.customer_id",
      "inspection.booking.listing.product.title",
      "inspection.booking.listing.product.vendor.name",
    ],
    filters,
    pagination: { skip: offset, take: limit },
  })

  res.json({
    disputes,
    count: metadata?.count ?? disputes.length,
    offset,
    limit,
  })
}
