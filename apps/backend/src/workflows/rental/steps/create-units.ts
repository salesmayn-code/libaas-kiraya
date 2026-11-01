import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

export type ListingUnitInput = {
  size_label: string
  tag_code: string
  condition_grade?: "A" | "B" | "C"
  notes?: string | null
}

type SpecForUnit = {
  size_label: string
  variant_id: string
}

export type CreateUnitsStepInput = {
  listing_id: string
  vendor_id: string
  units: ListingUnitInput[]
  specs: SpecForUnit[]
}

export const createUnitsStep = createStep(
  "create-units",
  async (input: CreateUnitsStepInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")

    if (input.units.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Add at least one physical unit")
    }

    const variantBySize = new Map(
      input.specs.map((spec) => [spec.size_label, spec.variant_id])
    )

    const seenTags = new Set<string>()

    const data = input.units.map((unit) => {
      const variantId = variantBySize.get(unit.size_label)

      if (!variantId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `No size ${unit.size_label} exists for this listing`
        )
      }

      const tag = unit.tag_code.trim().toUpperCase()

      if (!tag) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each unit needs a tag code")
      }

      if (seenTags.has(tag)) {
        throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, `Duplicate tag code ${tag}`)
      }

      seenTags.add(tag)

      return {
        listing_id: input.listing_id,
        variant_id: variantId,
        vendor_id: input.vendor_id,
        tag_code: tag,
        condition_grade: unit.condition_grade ?? "A",
        status: "active" as const,
        notes: unit.notes ?? null,
      }
    })

    const units = await rentalService.createRentalUnits(data)

    return new StepResponse(units, units.map((unit) => unit.id))
  },
  async (unitIds, { container }) => {
    if (!unitIds?.length) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.deleteRentalUnits(unitIds)
  }
)
