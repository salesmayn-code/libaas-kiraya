import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type AcceptInspectionInput = {
  booking_id: string
  customer_id: string
}

export const acceptInspectionStep = createStep(
  "accept-inspection",
  async (input: AcceptInspectionInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    const [inspection] = await rentalService.listRentalInspections({
      booking_id: booking.id,
    })

    if (!inspection) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "No inspection to accept")
    }

    if (inspection.status === "needs_admin_review") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This inspection is still being reviewed by our team"
      )
    }

    if (inspection.status !== "submitted") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This inspection is already decided")
    }

    if (new Date(inspection.dispute_deadline).getTime() < Date.now()) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The decision window has closed")
    }

    const updated = await rentalService.updateRentalInspections({
      id: inspection.id,
      status: "accepted",
      decided_at: new Date(),
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: booking.status,
      to_status: "settling",
      actor_type: "customer",
      actor_id: input.customer_id,
      meta: { inspection_id: inspection.id, decision: "accepted" },
    })

    return new StepResponse(
      { inspection: updated, deduction: Number(inspection.total_deduction) },
      { inspection_id: inspection.id, status: inspection.status }
    )
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalInspections({
      id: previous.inspection_id,
      status: previous.status as "submitted",
      decided_at: null,
    })
  }
)
