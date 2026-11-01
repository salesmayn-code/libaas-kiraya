import { Modules } from "@medusajs/framework/utils"
import type { LinkDefinition } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { RENTAL_MODULE } from "../../modules/rental"
import { VENDOR_MODULE } from "../../modules/vendor"
import type { ListingUnitInput } from "./steps/create-units"
import type { ListingVariantInput } from "./steps/create-product"
import { createProductStep } from "./steps/create-product"
import { createListingStep } from "./steps/create-listing"
import { createUnitsStep } from "./steps/create-units"
import { createVariantSpecsStep } from "./steps/create-variant-specs"
import { resolveVendorStep } from "./steps/resolve-vendor"

export type CreateListingWorkflowInput = {
  vendor_user_id: string
  listing: {
    title: string
    description?: string
    images: string[]
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
    fulfillment_modes: ("pickup" | "courier")[]
    cancellation_policy: "flexible" | "standard" | "strict"
    occasion_tags?: string[]
    variants: ListingVariantInput[]
    units: ListingUnitInput[]
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

const createListingWorkflow = createWorkflow(
  "create-listing",
  function (input: CreateListingWorkflowInput) {
    const vendor = resolveVendorStep({ vendor_user_id: input.vendor_user_id })

    const productInput = transform({ input }, ({ input }) => ({
      title: input.listing.title,
      description: input.listing.description,
      images: input.listing.images,
      variants: input.listing.variants,
      base_amount: input.listing.base_amount,
      handle: slugify(input.listing.title),
    }))

    const product = createProductStep(productInput)

    const listingInput = transform({ input, vendor, product }, ({ input, vendor, product }) => ({
      product_id: product.id,
      vendor_id: vendor.id,
      city: input.listing.city,
      base_amount: input.listing.base_amount,
      base_days: input.listing.base_days,
      extra_day_amount: input.listing.extra_day_amount,
      cleaning_fee_amount: input.listing.cleaning_fee_amount,
      deposit_amount: input.listing.deposit_amount,
      late_fee_amount: input.listing.late_fee_amount,
      lead_buffer_days: input.listing.lead_buffer_days,
      return_buffer_days: input.listing.return_buffer_days,
      min_days: input.listing.min_days,
      max_days: input.listing.max_days,
      fulfillment_modes: input.listing.fulfillment_modes,
      cancellation_policy: input.listing.cancellation_policy,
      occasion_tags: input.listing.occasion_tags ?? null,
    }))

    const listing = createListingStep(listingInput)

    const specsInput = transform({ input, listing, product }, ({ input, listing, product }) => ({
      listing_id: listing.id,
      variants: input.listing.variants,
      product_variants: product.variants ?? [],
    }))

    const specs = createVariantSpecsStep(specsInput)

    const unitsInput = transform(
      { input, listing, vendor, specs },
      ({ input, listing, vendor, specs }) => ({
        listing_id: listing.id,
        vendor_id: vendor.id,
        units: input.listing.units,
        specs: specs.map((spec) => ({
          size_label: spec.size_label,
          variant_id: spec.variant_id,
        })),
      })
    )

    const units = createUnitsStep(unitsInput)

    const links = transform({ vendor, product, listing, specs }, ({ vendor, product, listing, specs }) => {
      const linkDefinitions: LinkDefinition[] = [
        {
          [VENDOR_MODULE]: { vendor_id: vendor.id },
          [Modules.PRODUCT]: { product_id: product.id },
        },
        {
          [Modules.PRODUCT]: { product_id: product.id },
          [RENTAL_MODULE]: { rental_listing_id: listing.id },
        },
      ]

      for (const spec of specs) {
        linkDefinitions.push({
          [Modules.PRODUCT]: { product_variant_id: spec.variant_id },
          [RENTAL_MODULE]: { rental_variant_spec_id: spec.id },
        })
      }

      return linkDefinitions
    })

    createRemoteLinkStep(links)

    return new WorkflowResponse({
      listing,
      product,
      specs,
      units,
    })
  }
)

export default createListingWorkflow
