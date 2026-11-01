import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type ResolveDisputeInput = {
  dispute_id: string
  admin_id: string
  resolution: "customer" | "vendor" | "split"
  resolved_deduction: number
  admin_notes?: string | null
}

export const resolveDisputeStep = createStep(
  "resolve-dispute",
  async (input: ResolveDisputeInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const dispute = await rentalService.retrieveRentalDispute(input.dispute_id)

    if (dispute.status === "resolved") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This dispute is already resolved")
    }

    const [inspection] = await rentalService.listRentalInspections({
      booking_id: dispute.booking_id,
    })

    if (!inspection) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Inspection not found")
    }

    const booking = await rentalService.retrieveRentalBooking(dispute.booking_id)

    let deduction = input.resolved_deduction

    if (input.resolution === "customer") {
      deduction = 0
    } else if (input.resolution === "vendor") {
      deduction = Number(inspection.total_deduction)
    }

    if (!Number.isFinite(deduction) || deduction < 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resolution amount is invalid")
    }

    const previous = {
      dispute_status: dispute.status,
      inspection_status: inspection.status,
      booking_status: booking.status,
    }

    await rentalService.updateRentalDisputes({
      id: dispute.id,
      status: "resolved",
      resolution: input.resolution,
      resolved_deduction: deduction,
      admin_notes: input.admin_notes ?? null,
      resolved_by: input.admin_id,
      resolved_at: new Date(),
    })

    await rentalService.updateRentalInspections({
      id: inspection.id,
      status: "resolved",
      decided_at: new Date(),
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: booking.status,
      to_status: "settling",
      actor_type: "admin",
      actor_id: input.admin_id,
      meta: {
        dispute_id: dispute.id,
        resolution: input.resolution,
        resolved_deduction: deduction,
      },
    })

    return new StepResponse(
      { booking_id: booking.id, deduction },
      {
        dispute_id: dispute.id,
        inspection_id: inspection.id,
        booking_id: booking.id,
        ...previous,
      }
    )
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")

    await rentalService.updateRentalDisputes({
      id: previous.dispute_id,
      status: previous.dispute_status as "open" | "under_review",
      resolution: null,
      resolved_deduction: null,
      resolved_by: null,
      resolved_at: null,
    })

    await rentalService.updateRentalInspections({
      id: previous.inspection_id,
      status: previous.inspection_status as "disputed",
      decided_at: null,
    })

    await rentalService.updateRentalBookings({
      id: previous.booking_id,
      status: previous.booking_status as "disputed",
    })
  }
)
