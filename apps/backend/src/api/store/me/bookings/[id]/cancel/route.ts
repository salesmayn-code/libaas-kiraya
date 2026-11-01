import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import cancelRentalWorkflow from "../../../../../../workflows/rental/cancel-rental"

export const PostBookingCancelSchema = z.strictObject({
  reason: z.string().min(3).max(500).optional(),
})

type RequestBody = z.infer<typeof PostBookingCancelSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await cancelRentalWorkflow(req.scope).run({
    input: {
      booking_id: req.params.id,
      actor_type: "customer",
      actor_id: req.auth_context.actor_id,
      reason: req.validatedBody.reason,
    },
  })

  res.json(result)
}
