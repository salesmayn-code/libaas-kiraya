import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const customerService = req.scope.resolve(Modules.CUSTOMER)

  const { data: vendorUsers } = await query.graph({
    entity: "vendor_user",
    fields: ["vendor.id"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendorId = vendorUsers[0]?.vendor?.id

  if (!vendorId) {
    res.status(404).json({ message: "Vendor account not found" })
    return
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const status = typeof req.query.status === "string" ? req.query.status : undefined

  const filters: Record<string, unknown> = { vendor_id: vendorId }

  if (status) {
    filters.status = status
  }

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
      "delivery_address",
      "rental_fee",
      "deposit_amount",
      "customer_id",
      "listing.id",
      "listing.product.title",
      "listing.product.thumbnail",
      "unit.id",
      "unit.tag_code",
      "deposit.status",
    ],
    filters,
    pagination: { skip: offset, take: limit },
  })

  const customerIds = [...new Set(bookings.map((booking) => booking.customer_id))]
  const customers = customerIds.length
    ? await customerService.listCustomers({ id: customerIds })
    : []

  const customerById = new Map(customers.map((customer) => [customer.id, customer]))

  res.json({
    bookings: bookings.map((booking) => ({
      ...booking,
      customer: booking.customer_id ? customerById.get(booking.customer_id) ?? null : null,
    })),
    count: metadata?.count ?? bookings.length,
    offset,
    limit,
  })
}
