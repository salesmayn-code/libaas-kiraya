import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import MeasurementModuleService from "../../../modules/measurement/service"

export type SaveMeasurementInput = {
  id?: string
  customer_id: string
  label: string
  garment_type: "women" | "men" | "kids"
  unit: "in" | "cm"
  bust_chest?: number | null
  waist?: number | null
  hips?: number | null
  shoulder?: number | null
  height?: number | null
  is_default?: boolean
  notes?: string | null
}

export const saveMeasurementStep = createStep(
  "save-measurement",
  async (input: SaveMeasurementInput, { container }) => {
    const service: MeasurementModuleService = container.resolve("measurement")

    const values = [
      input.bust_chest,
      input.waist,
      input.hips,
      input.shoulder,
      input.height,
    ].filter((value): value is number => typeof value === "number")

    if (values.some((value) => value <= 0 || value > 300)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Measurements must be positive numbers")
    }

    if (input.is_default) {
      const existingDefaults = await service.listMeasurementProfiles({
        customer_id: input.customer_id,
        is_default: true,
      })

      for (const profile of existingDefaults) {
        if (profile.id !== input.id) {
          await service.updateMeasurementProfiles({
            id: profile.id,
            is_default: false,
          })
        }
      }
    }

    if (input.id) {
      const existing = await service.retrieveMeasurementProfile(input.id)

      if (existing.customer_id !== input.customer_id) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "Measurement profile not found")
      }

      const updated = await service.updateMeasurementProfiles({
        id: input.id,
        label: input.label,
        garment_type: input.garment_type,
        unit: input.unit,
        bust_chest: input.bust_chest ?? null,
        waist: input.waist ?? null,
        hips: input.hips ?? null,
        shoulder: input.shoulder ?? null,
        height: input.height ?? null,
        is_default: input.is_default ?? existing.is_default,
        notes: input.notes ?? null,
      })

      return new StepResponse(updated, { created: false, id: updated.id })
    }

    const created = await service.createMeasurementProfiles({
      customer_id: input.customer_id,
      label: input.label,
      garment_type: input.garment_type,
      unit: input.unit,
      bust_chest: input.bust_chest ?? null,
      waist: input.waist ?? null,
      hips: input.hips ?? null,
      shoulder: input.shoulder ?? null,
      height: input.height ?? null,
      is_default: input.is_default ?? false,
      notes: input.notes ?? null,
    })

    return new StepResponse(created, { created: true, id: created.id })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const service: MeasurementModuleService = container.resolve("measurement")

    if (previous.created) {
      await service.deleteMeasurementProfiles(previous.id)
    }
  }
)
