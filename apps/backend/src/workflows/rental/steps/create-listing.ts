import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

export type CreateListingStepInput = {
  product_id: string
  vendor_id: string
  city: string
  base_amount: number
  base_days: number
  extra_day_amount: number
  cleaning_fee_amount: number
  deposit_amount: number
  late_fee_amount: number
  lead_buffer_days?: number
  return_buffer_days?: number
  min_days: number
  max_days: number
  fulfillment_modes: string[]
  cancellation_policy: "flexible" | "standard" | "strict"
  occasion_tags?: string[] | null
}

export const createListingStep = createStep(
  "create-listing",
  async (input: CreateListingStepInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const settings = await rentalService.getSettings()

    if (input.base_days < 1) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "The base package must be at least 1 day")
    }

    if (input.min_days < 1 || input.max_days < input.min_days) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Check the minimum and maximum days")
    }

    if (
      input.base_amount < 0 ||
      input.extra_day_amount < 0 ||
      input.cleaning_fee_amount < 0 ||
      input.deposit_amount < 0 ||
      input.late_fee_amount < 0
    ) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Amounts cannot be negative")
    }

    const allowedModes = new Set(["pickup", "courier"])
    const modes = [...new Set(input.fulfillment_modes)]

    if (!modes.length || modes.some((mode) => !allowedModes.has(mode))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Choose pickup, courier, or both"
      )
    }

    const listing = await rentalService.createRentalListings({
      product_id: input.product_id,
      vendor_id: input.vendor_id,
      city: input.city,
      status: "draft",
      base_amount: input.base_amount,
      base_days: input.base_days,
      extra_day_amount: input.extra_day_amount,
      cleaning_fee_amount: input.cleaning_fee_amount,
      deposit_amount: input.deposit_amount,
      late_fee_amount: input.late_fee_amount,
      lead_buffer_days: input.lead_buffer_days ?? settings.default_lead_buffer_days,
      return_buffer_days: input.return_buffer_days ?? settings.default_return_buffer_days,
      min_days: input.min_days,
      max_days: input.max_days,
      fulfillment_modes: modes,
      cancellation_policy: input.cancellation_policy,
      occasion_tags: input.occasion_tags ?? null,
    })

    return new StepResponse(listing, listing.id)
  },
  async (listingId, { container }) => {
    if (!listingId) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.deleteRentalListings(listingId)
  }
)
