import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"
import type { ListingVariantInput } from "./create-product"

type ProductVariantForSpec = {
  id: string
  metadata?: Record<string, unknown> | null
}

export type CreateVariantSpecsStepInput = {
  listing_id: string
  variants: ListingVariantInput[]
  product_variants: ProductVariantForSpec[]
}

export const createVariantSpecsStep = createStep(
  "create-variant-specs",
  async (input: CreateVariantSpecsStepInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")

    const bySize = new Map<string, ProductVariantForSpec>()

    for (const variant of input.product_variants) {
      const size = variant.metadata?.size_label

      if (typeof size === "string") {
        bySize.set(size, variant)
      }
    }

    const data = input.variants.map((variant) => {
      const productVariant = bySize.get(variant.size_label)

      if (!productVariant) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `No product variant found for size ${variant.size_label}`
        )
      }

      if (!variant.measurements || Object.keys(variant.measurements).length === 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Add measurements for size ${variant.size_label}`
        )
      }

      return {
        listing_id: input.listing_id,
        variant_id: productVariant.id,
        size_label: variant.size_label,
        measurements: variant.measurements,
        alterable: variant.alterable,
        alteration_notes: variant.alteration_notes ?? null,
      }
    })

    const specs = await rentalService.createRentalVariantSpecs(data)

    return new StepResponse(specs, specs.map((spec) => spec.id))
  },
  async (specIds, { container }) => {
    if (!specIds?.length) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.deleteRentalVariantSpecs(specIds)
  }
)
