import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import addRentalToCartWorkflow from "../../../../../workflows/rental/add-rental-to-cart"

export const PostCartRentalSchema = z.strictObject({
  listing_id: z.string().min(1),
  variant_spec_id: z.string().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rental_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rental_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fulfillment_mode: z.enum(["pickup", "courier"]).optional(),
})

type RequestBody = z.infer<typeof PostCartRentalSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await addRentalToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      customer_id: req.auth_context.actor_id,
      ...req.validatedBody,
    },
  })

  res.status(201).json({
    booking: result.booking,
    cart: result.cart,
  })
}
