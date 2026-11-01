import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type AttachLineItemInput = {
  booking_id: string
  line_item_id: string
}

export const attachBookingLineItemStep = createStep(
  "attach-booking-line-item",
  async ({ booking_id, line_item_id }: AttachLineItemInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")

    const booking = await rentalService.updateRentalBookings({
      id: booking_id,
      line_item_id,
    })

    return new StepResponse(booking, { booking_id })
  },
  async (previous, { container }) => {
    if (!previous?.booking_id) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalBookings({
      id: previous.booking_id,
      line_item_id: null,
    })
  }
)
