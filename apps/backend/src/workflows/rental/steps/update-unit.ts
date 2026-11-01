import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

export type UpdateUnitInput = {
  vendor_user_id: string
  unit_id: string
  status?: "active" | "maintenance" | "retired"
  condition_grade?: "A" | "B" | "C"
  notes?: string | null
}

export const updateUnitStep = createStep(
  "update-unit",
  async (input: UpdateUnitInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const rentalService: RentalModuleService = container.resolve("rental")

    const { data: vendorUsers } = await query.graph({
      entity: "vendor_user",
      fields: ["vendor.id"],
      filters: { id: input.vendor_user_id },
    })

    const vendorId = vendorUsers[0]?.vendor?.id

    if (!vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
    }

    const unit = await rentalService.retrieveRentalUnit(input.unit_id)

    if (unit.vendor_id !== vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Unit not found")
    }

    const previous = {
      id: unit.id,
      status: unit.status,
      condition_grade: unit.condition_grade,
      notes: unit.notes,
    }

    const updated = await rentalService.updateRentalUnits({
      id: unit.id,
      ...(input.status ? { status: input.status } : {}),
      ...(input.condition_grade ? { condition_grade: input.condition_grade } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalUnits({
      id: previous.id,
      status: previous.status,
      condition_grade: previous.condition_grade,
      notes: previous.notes,
    })
  }
)
