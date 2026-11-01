import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type ApproveInspectionInput = {
  inspection_id: string
  admin_id: string
}

export const approveInspectionStep = createStep(
  "approve-inspection",
  async (input: ApproveInspectionInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const inspection = await rentalService.retrieveRentalInspection(input.inspection_id)

    if (inspection.status !== "needs_admin_review") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This inspection is not waiting for admin review"
      )
    }

    const settings = await rentalService.getSettings()

    const updated = await rentalService.updateRentalInspections({
      id: inspection.id,
      status: "submitted",
      dispute_deadline: new Date(
        Date.now() + settings.dispute_window_hours * 60 * 60 * 1000
      ),
    })

    await rentalService.createRentalBookingEvents({
      booking_id: inspection.booking_id,
      from_status: "settling",
      to_status: "settling",
      actor_type: "admin",
      actor_id: input.admin_id,
      meta: { inspection_id: inspection.id, action: "approved_for_customer" },
    })

    return new StepResponse(updated, {
      inspection_id: inspection.id,
      status: inspection.status,
      deadline: inspection.dispute_deadline,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalInspections({
      id: previous.inspection_id,
      status: previous.status as "needs_admin_review",
      dispute_deadline: previous.deadline,
    })
  }
)
