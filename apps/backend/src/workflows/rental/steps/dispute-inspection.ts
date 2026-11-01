import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type DisputeInspectionInput = {
  booking_id: string
  customer_id: string
  reason: string
  evidence_keys?: string[]
}

export const disputeInspectionStep = createStep(
  "dispute-inspection",
  async (input: DisputeInspectionInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    const [inspection] = await rentalService.listRentalInspections({
      booking_id: booking.id,
    })

    if (!inspection) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "No inspection to dispute")
    }

    if (inspection.status !== "submitted") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This inspection cannot be disputed any more"
      )
    }

    if (new Date(inspection.dispute_deadline).getTime() < Date.now()) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The dispute window has closed")
    }

    const dispute = await rentalService.createRentalDisputes({
      inspection_id: inspection.id,
      booking_id: booking.id,
      opened_by: input.customer_id,
      reason: input.reason,
      evidence_keys: input.evidence_keys ?? null,
      status: "open",
      opened_at: new Date(),
    })

    await rentalService.updateRentalInspections({
      id: inspection.id,
      status: "disputed",
    })

    await rentalService.updateRentalBookings({
      id: booking.id,
      status: "disputed",
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: booking.status,
      to_status: "disputed",
      actor_type: "customer",
      actor_id: input.customer_id,
      meta: { dispute_id: dispute.id, inspection_id: inspection.id },
    })

    return new StepResponse(dispute, {
      dispute_id: dispute.id,
      inspection_id: inspection.id,
      booking_id: booking.id,
      previous_status: booking.status,
      previous_inspection_status: inspection.status,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.deleteRentalDisputes(previous.dispute_id)
    await rentalService.updateRentalInspections({
      id: previous.inspection_id,
      status: previous.previous_inspection_status as "submitted",
    })
    await rentalService.updateRentalBookings({
      id: previous.booking_id,
      status: previous.previous_status as "settling",
    })
  }
)
