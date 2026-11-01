import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { addRentalLineItemStep } from "./steps/add-line-item"
import { attachBookingLineItemStep } from "./steps/attach-line-item"
import { reserveUnitStep } from "./steps/reserve-unit"

export type AddRentalToCartWorkflowInput = {
  cart_id: string
  customer_id: string
  listing_id: string
  variant_spec_id: string
  event_date: string
  rental_start: string
  rental_end: string
  fulfillment_mode?: "pickup" | "courier"
}

const addRentalToCartWorkflow = createWorkflow(
  "add-rental-to-cart",
  function (input: AddRentalToCartWorkflowInput) {
    const { data: rentalListings } = useQueryGraphStep({
      entity: "rental_listing",
      fields: ["id", "product.id", "product.title", "product.thumbnail"],
      filters: { id: input.listing_id },
    }).config({ name: "retrieve-rental-product" })

    const booking = reserveUnitStep({
      listing_id: input.listing_id,
      variant_spec_id: input.variant_spec_id,
      customer_id: input.customer_id,
      cart_id: input.cart_id,
      event_date: input.event_date,
      rental_start: input.rental_start,
      rental_end: input.rental_end,
      fulfillment_mode: input.fulfillment_mode,
    })

    const lineItemData = transform(
      { input, booking, rentalListings },
      ({ input, booking, rentalListings }) => {
        const product = rentalListings[0]?.product

        return {
          cart_id: input.cart_id,
          booking,
          title: product?.title ?? "Rental outfit",
          product_id: product?.id ?? "",
          thumbnail: product?.thumbnail ?? undefined,
        }
      }
    )

    const lineItem = addRentalLineItemStep(lineItemData)

    const attachInput = transform(
      { booking, lineItem },
      ({ booking, lineItem }) => ({
        booking_id: booking.id,
        line_item_id: lineItem.line_item_id,
      })
    )

    attachBookingLineItemStep(attachInput)

    return new WorkflowResponse({ booking, cart: lineItem.cart })
  }
)

export default addRentalToCartWorkflow
