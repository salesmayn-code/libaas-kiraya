import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const status = typeof req.query.status === "string" ? req.query.status : undefined
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const filters: Record<string, unknown> = {}

  if (status) filters.status = status

  const { data: inspections, metadata } = await query.graph({
    entity: "rental_inspection",
    fields: [
      "*",
      "booking.id",
      "booking.status",
      "booking.rental_start",
      "booking.rental_end",
      "booking.deposit_amount",
      "booking.listing.product.title",
      "booking.listing.product.vendor.name",
    ],
    filters,
    pagination: { skip: offset, take: limit },
  })

  res.json({
    inspections,
    count: metadata?.count ?? inspections.length,
    offset,
    limit,
  })
}
