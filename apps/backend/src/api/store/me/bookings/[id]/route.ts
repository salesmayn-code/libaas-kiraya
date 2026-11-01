import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "rental_booking",
    fields: [
      "*",
      "listing.id",
      "listing.product.title",
      "listing.product.thumbnail",
      "listing.product.description",
      "listing.product.vendor.id",
      "listing.product.vendor.name",
      "listing.product.vendor.city",
      "listing.product.vendor.phone",
      "listing.product.vendor.whatsapp",
      "unit.tag_code",
      "deposit.*",
      "inspection.*",
      "inspection.dispute.*",
      "events.*",
    ],
    filters: {
      id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })

  const booking = data[0]

  if (!booking) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
  }

  const reviewService = req.scope.resolve("review")
  const [review] = await reviewService.listReviews({ booking_id: booking.id })

  res.json({ booking, reviewed: Boolean(review) })
}
