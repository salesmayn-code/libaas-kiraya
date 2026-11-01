import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const { data: bookings, metadata } = await query.graph({
    entity: "rental_booking",
    fields: [
      "id",
      "status",
      "ops_flag",
      "event_date",
      "rental_start",
      "rental_end",
      "hold_expires_at",
      "fulfillment_mode",
      "rental_fee",
      "cleaning_fee",
      "deposit_amount",
      "order_id",
      "listing.id",
      "listing.product.title",
      "listing.product.thumbnail",
      "listing.product.vendor.id",
      "listing.product.vendor.name",
      "listing.product.vendor.city",
      "unit.tag_code",
      "deposit.status",
      "deposit.amount",
    ],
    filters: { customer_id: req.auth_context.actor_id },
    pagination: { skip: offset, take: limit },
  })

  res.json({
    bookings,
    count: metadata?.count ?? bookings.length,
    offset,
    limit,
  })
}
