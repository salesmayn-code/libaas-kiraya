import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type ValidateRentalCartInput = {
  cart_id: string
  customer_id: string
}

export const validateRentalCartStep = createStep(
  "validate-rental-cart",
  async (input: ValidateRentalCartInput, { container }) => {
    const cartService = container.resolve(Modules.CART)
    const rentalService: RentalModuleService = container.resolve("rental")

    const cart = await cartService.retrieveCart(input.cart_id, {
      relations: ["items"],
    })

    if (cart.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
    }

    const rentalLineBookingIds = (cart.items ?? [])
      .map((item) => item.metadata?.booking_id)
      .filter((bookingId): bookingId is string => typeof bookingId === "string")

    if (!rentalLineBookingIds.length) {
      return new StepResponse({ rentals: 0 })
    }

    const bookings = await rentalService.listRentalBookings({
      cart_id: input.cart_id,
    })

    if (bookings.length !== rentalLineBookingIds.length) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "The cart's rental lines are out of sync. Remove and re-add the outfit"
      )
    }

    const now = Date.now()

    for (const booking of bookings) {
      if (booking.status !== "held" || !booking.hold_expires_at) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "A rental hold is no longer active. Reserve it again"
        )
      }

      if (new Date(booking.hold_expires_at).getTime() <= now) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Your reservation ended. The outfit is still free for these dates. Reserve again"
        )
      }
    }

    return new StepResponse({ rentals: bookings.length })
  }
)
