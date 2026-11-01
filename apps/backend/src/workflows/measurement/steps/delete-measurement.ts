import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import MeasurementModuleService from "../../../modules/measurement/service"

type DeleteMeasurementInput = {
  id: string
  customer_id: string
}

export const deleteMeasurementStep = createStep(
  "delete-measurement",
  async (input: DeleteMeasurementInput, { container }) => {
    const service: MeasurementModuleService = container.resolve("measurement")
    const profile = await service.retrieveMeasurementProfile(input.id)

    if (profile.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Measurement profile not found")
    }

    await service.softDeleteMeasurementProfiles(input.id)

    return new StepResponse({ id: input.id }, input.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }

    const service: MeasurementModuleService = container.resolve("measurement")
    await service.restoreMeasurementProfiles(id)
  }
)
