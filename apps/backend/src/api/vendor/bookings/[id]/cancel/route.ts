import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import cancelRentalWorkflow from "../../../../../workflows/rental/cancel-rental"

export const PostVendorCancelSchema = z.strictObject({
  reason: z.string().min(3).max(500),
})

type RequestBody = z.infer<typeof PostVendorCancelSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await cancelRentalWorkflow(req.scope).run({
    input: {
      booking_id: req.params.id,
      actor_type: "vendor",
      actor_id: req.auth_context.actor_id,
      reason: req.validatedBody.reason,
    },
  })

  res.json(result)
}
