import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { addToCartWorkflow, deleteLineItemsWorkflow } from "@medusajs/medusa/core-flows"
import RentalModuleService from "../../../modules/rental/service"

export type ReleaseRentalHoldInput = {
  booking_id: string
  cart_id: string
  customer_id: string
  reason?: string
}

type Compensation = {
  booking_id: string
  cart_id: string
  line_item_id: string | null
  was_deleted: boolean
}

export const releaseRentalHoldStep = createStep(
  "release-rental-hold",
  async (input: ReleaseRentalHoldInput, { container, context }) => {
    const rentalService: RentalModuleService = container.resolve("rental")

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (
      booking.customer_id !== input.customer_id ||
      booking.cart_id !== input.cart_id
    ) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Reservation not found")
    }

    if (booking.status !== "held") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only an active hold can be released from the cart"
      )
    }

    const compensation: Compensation = {
      booking_id: booking.id,
      cart_id: input.cart_id,
      line_item_id: booking.line_item_id,
      was_deleted: false,
    }

    if (booking.line_item_id) {
      await deleteLineItemsWorkflow(container).run({
        input: { cart_id: input.cart_id, ids: [booking.line_item_id] },
        context,
      })
      compensation.was_deleted = true
    }

    await rentalService.updateRentalBookings({
      id: booking.id,
      status: "cancelled",
      cancelled_by: "customer",
      cancellation_reason: input.reason ?? "Removed from cart",
      cancelled_at: new Date(),
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: "held",
      to_status: "cancelled",
      actor_type: "customer",
      actor_id: input.customer_id,
      meta: { reason: input.reason ?? "Removed from cart" },
    })

    return new StepResponse({ booking_id: booking.id, cart_id: input.cart_id }, compensation)
  },
  async (compensation, { container, context }) => {
    if (!compensation) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const rentalService: RentalModuleService = container.resolve("rental")
    const booking = await rentalService.retrieveRentalBooking(compensation.booking_id)
    const settings = await rentalService.getSettings()

    if (compensation.was_deleted) {
      const { data: listings } = await query.graph({
        entity: "rental_listing",
        fields: ["id", "product.id", "product.title", "product.thumbnail"],
        filters: { id: booking.listing_id },
      })

      const product = listings[0]?.product

      await addToCartWorkflow(container).run({
        input: {
          cart_id: compensation.cart_id,
          items: [
            {
              variant_id: booking.variant_id,
              quantity: 1,
              product_id: product?.id,
              product_title: product?.title,
              title: `Rental — ${product?.title ?? "outfit"}`,
              thumbnail: product?.thumbnail ?? undefined,
              unit_price:
                Number(booking.rental_fee) +
                Number(booking.cleaning_fee) +
                Number(booking.deposit_amount),
              is_discountable: false,
              requires_shipping: false,
              metadata: {
                kind: "rental",
                booking_id: booking.id,
                rental_listing_id: booking.listing_id,
                event_date: new Date(booking.event_date).toISOString().slice(0, 10),
                rental_start: new Date(booking.rental_start).toISOString().slice(0, 10),
                rental_end: new Date(booking.rental_end).toISOString().slice(0, 10),
                rental_fee: Number(booking.rental_fee),
                cleaning_fee: Number(booking.cleaning_fee),
                deposit_amount: Number(booking.deposit_amount),
                hold_expires_at: new Date(
                  Date.now() + settings.hold_ttl_minutes * 60_000
                ).toISOString(),
              },
            },
          ],
        },
        context,
      })
    }

    await rentalService.updateRentalBookings({
      id: booking.id,
      status: "held",
      cancelled_by: null,
      cancellation_reason: null,
      cancelled_at: null,
      hold_expires_at: new Date(Date.now() + settings.hold_ttl_minutes * 60_000),
    })
  }
)
