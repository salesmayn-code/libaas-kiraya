import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"

type PublishListingInput = {
  vendor_user_id: string
  listing_id: string
}

type PublishCheckListing = {
  id: string
  vendor_id: string
  status: string
  product?: {
    thumbnail?: string | null
    images?: { url: string }[] | null
  } | null
  variants?: { measurements?: Record<string, unknown> | null }[] | null
  units?: { status: string }[] | null
}

export const publishListingStep = createStep(
  "publish-listing",
  async (input: PublishListingInput, { container }) => {
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

    const { data } = await query.graph({
      entity: "rental_listing",
      fields: [
        "id",
        "vendor_id",
        "status",
        "product.thumbnail",
        "product.images.url",
        "variants.measurements",
        "units.status",
      ],
      filters: { id: input.listing_id, vendor_id: vendorId },
    })

    const listing = data[0] as PublishCheckListing | undefined

    if (!listing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing not found")
    }

    if (listing.status === "active") {
      const updated = await rentalService.retrieveRentalListing(listing.id)
      return new StepResponse(updated, { id: listing.id, status: listing.status })
    }

    const images = listing.product?.images ?? []
    const photoCount = images.length || (listing.product?.thumbnail ? 1 : 0)

    if (photoCount < 3) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Add at least 3 photos before publishing"
      )
    }

    const variants = listing.variants ?? []
    const hasMeasurements = variants.some(
      (variant) => variant.measurements && Object.keys(variant.measurements).length > 0
    )

    if (!variants.length || !hasMeasurements) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Add at least one size with measurements before publishing"
      )
    }

    const activeUnits = (listing.units ?? []).filter((unit) => unit.status === "active")

    if (!activeUnits.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Add at least one active physical unit before publishing"
      )
    }

    const updated = await rentalService.updateRentalListings({
      id: listing.id,
      status: "active",
    })

    return new StepResponse(updated, { id: listing.id, status: listing.status })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalListings({
      id: previous.id,
      status: previous.status as "draft" | "active" | "paused",
    })
  }
)
