import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import RentalModuleService from "../../../modules/rental/service"

export type UpdateListingInput = {
  vendor_user_id: string
  listing_id: string
  title?: string
  description?: string
  images?: string[]
  city?: string
  base_amount?: number
  base_days?: number
  extra_day_amount?: number
  cleaning_fee_amount?: number
  deposit_amount?: number
  late_fee_amount?: number
  lead_buffer_days?: number
  return_buffer_days?: number
  min_days?: number
  max_days?: number
  fulfillment_modes?: ("pickup" | "courier")[]
  cancellation_policy?: "flexible" | "standard" | "strict"
  occasion_tags?: string[]
}

type PreviousProduct = {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  images: { url: string }[]
}

export const updateListingStep = createStep(
  "update-listing",
  async (input: UpdateListingInput, { container, context }) => {
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

    const previousListing = {
      city: listing.city,
      base_amount: Number(listing.base_amount),
      base_days: listing.base_days,
      extra_day_amount: Number(listing.extra_day_amount),
      cleaning_fee_amount: Number(listing.cleaning_fee_amount),
      deposit_amount: Number(listing.deposit_amount),
      late_fee_amount: Number(listing.late_fee_amount),
      lead_buffer_days: listing.lead_buffer_days,
      return_buffer_days: listing.return_buffer_days,
      min_days: listing.min_days,
      max_days: listing.max_days,
      fulfillment_modes: listing.fulfillment_modes,
      cancellation_policy: listing.cancellation_policy,
      occasion_tags: listing.occasion_tags,
    }

    const listingUpdate: Record<string, unknown> = { id: listing.id }

    if (input.city !== undefined) listingUpdate.city = input.city
    if (input.base_amount !== undefined) listingUpdate.base_amount = input.base_amount
    if (input.base_days !== undefined) listingUpdate.base_days = input.base_days
    if (input.extra_day_amount !== undefined) listingUpdate.extra_day_amount = input.extra_day_amount
    if (input.cleaning_fee_amount !== undefined)
      listingUpdate.cleaning_fee_amount = input.cleaning_fee_amount
    if (input.deposit_amount !== undefined) listingUpdate.deposit_amount = input.deposit_amount
    if (input.late_fee_amount !== undefined) listingUpdate.late_fee_amount = input.late_fee_amount
    if (input.lead_buffer_days !== undefined) listingUpdate.lead_buffer_days = input.lead_buffer_days
    if (input.return_buffer_days !== undefined)
      listingUpdate.return_buffer_days = input.return_buffer_days
    if (input.min_days !== undefined) listingUpdate.min_days = input.min_days
    if (input.max_days !== undefined) listingUpdate.max_days = input.max_days
    if (input.fulfillment_modes !== undefined)
      listingUpdate.fulfillment_modes = input.fulfillment_modes
    if (input.cancellation_policy !== undefined)
      listingUpdate.cancellation_policy = input.cancellation_policy
    if (input.occasion_tags !== undefined) listingUpdate.occasion_tags = input.occasion_tags

    const updated = await rentalService.updateRentalListings(listingUpdate)

    const productFields: Record<string, unknown> = { id: listing.product_id }
    let shouldUpdateProduct = false
    let previousProduct: PreviousProduct | null = null

    if (input.title !== undefined || input.description !== undefined || input.images !== undefined) {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "description", "thumbnail", "images.url"],
        filters: { id: listing.product_id },
      })

      const product = products[0]

      if (product) {
        previousProduct = {
          id: product.id,
          title: product.title,
          description: product.description,
          thumbnail: product.thumbnail,
          images: product.images ?? [],
        }

        if (input.title !== undefined) productFields.title = input.title
        if (input.description !== undefined) productFields.description = input.description
        if (input.images !== undefined) {
          productFields.images = input.images.map((url) => ({ url }))
          productFields.thumbnail = input.images[0]
        }

        shouldUpdateProduct = true
      }
    }

    if (shouldUpdateProduct) {
      await updateProductsWorkflow(container).run({
        input: { products: [productFields] },
        context,
      })
    }

    return new StepResponse(updated, {
      vendor_user_id: input.vendor_user_id,
      listing_id: listing.id,
      previous_listing: previousListing,
      previous_product: previousProduct,
      product_changed: shouldUpdateProduct,
    })
  },
  async (previous, { container, context }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")

    await rentalService.updateRentalListings({
      id: previous.listing_id,
      ...previous.previous_listing,
    })

    if (previous.product_changed && previous.previous_product) {
      await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              id: previous.previous_product.id,
              title: previous.previous_product.title,
              description: previous.previous_product.description ?? undefined,
              thumbnail: previous.previous_product.thumbnail ?? undefined,
              images: previous.previous_product.images,
            },
          ],
        },
        context,
      })
    }
  }
)
