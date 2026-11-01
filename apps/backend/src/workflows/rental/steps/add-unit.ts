import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

export type AddUnitInput = {
  vendor_user_id: string
  listing_id: string
  size_label: string
  tag_code: string
  condition_grade?: "A" | "B" | "C"
  notes?: string | null
}

export const addUnitStep = createStep(
  "add-unit",
  async (input: AddUnitInput, { container }) => {
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

    const listing = await rentalService.retrieveRentalListing(input.listing_id)

    if (listing.vendor_id !== vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing not found")
    }

    const [spec] = await rentalService.listRentalVariantSpecs({
      listing_id: listing.id,
      size_label: input.size_label,
    })

    if (!spec) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No size ${input.size_label} exists for this listing`
      )
    }

    const tag = input.tag_code.trim().toUpperCase()

    if (!tag) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A tag code is required")
    }

    const existing = await rentalService.listRentalUnits({
      vendor_id: vendorId,
      tag_code: tag,
    })

    if (existing.length) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Tag code ${tag} is already in use`
      )
    }

    const unit = await rentalService.createRentalUnits({
      listing_id: listing.id,
      variant_id: spec.variant_id,
      vendor_id: vendorId,
      tag_code: tag,
      condition_grade: input.condition_grade ?? "A",
      status: "active",
      notes: input.notes ?? null,
    })

    return new StepResponse(unit, unit.id)
  },
  async (unitId, { container }) => {
    if (!unitId) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.deleteRentalUnits(unitId)
  }
)
