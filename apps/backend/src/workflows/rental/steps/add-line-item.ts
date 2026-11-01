import { Modules } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { addToCartWorkflow, deleteLineItemsWorkflow } from "@medusajs/medusa/core-flows"
import type { ReservedBooking } from "./reserve-unit"

export type AddRentalLineItemStepInput = {
  cart_id: string
  booking: ReservedBooking
  title: string
  thumbnail?: string
  product_id: string
}

export const addRentalLineItemStep = createStep(
  "add-rental-line-item",
  async (input: AddRentalLineItemStepInput, { container, context }) => {
    const cartService = container.resolve(Modules.CART)
    const cart = await cartService.retrieveCart(input.cart_id, {
      relations: ["items"],
    })

    if (cart.completed_at) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart has already been completed")
    }

    if (cart.customer_id !== input.booking.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart belongs to another customer")
    }

    if (cart.currency_code !== "pkr") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Rental carts must use the Pakistani rupee region"
      )
    }

    await addToCartWorkflow(container).run({
      input: {
        cart_id: input.cart_id,
        items: [
          {
            variant_id: input.booking.variant_id,
            quantity: 1,
            title: `Rental — ${input.title}`,
            subtitle: `${input.booking.rental_start} to ${input.booking.rental_end}`,
            thumbnail: input.thumbnail,
            product_id: input.product_id,
            product_title: input.title,
            unit_price: input.booking.total_today,
            is_discountable: false,
            requires_shipping: false,
            metadata: {
              kind: "rental",
              booking_id: input.booking.id,
              rental_listing_id: input.booking.listing_id,
              event_date: input.booking.event_date,
              rental_start: input.booking.rental_start,
              rental_end: input.booking.rental_end,
              rental_fee: input.booking.rental_fee,
              cleaning_fee: input.booking.cleaning_fee,
              deposit_amount: input.booking.deposit_amount,
              hold_expires_at: input.booking.hold_expires_at,
            },
          },
        ],
      },
      context,
    })

    const updatedCart = await cartService.retrieveCart(input.cart_id, {
      relations: ["items"],
    })

    const lineItem = updatedCart?.items?.find(
      (item) => item.metadata?.booking_id === input.booking.id
    )

    if (!updatedCart || !lineItem) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "The rental line item was not added to the cart"
      )
    }

    return new StepResponse(
      { cart: updatedCart, line_item_id: lineItem.id },
      {
        cart_id: input.cart_id,
        line_item_id: lineItem.id,
        booking_id: input.booking.id,
      }
    )
  },
  async (compensation, { container, context }) => {
    if (!compensation?.line_item_id) {
      return
    }

    await deleteLineItemsWorkflow(container).run({
      input: {
        cart_id: compensation.cart_id,
        ids: [compensation.line_item_id],
      },
      context,
    })
  }
)
