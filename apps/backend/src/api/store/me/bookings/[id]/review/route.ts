import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import submitReviewWorkflow from "../../../../../../workflows/review/submit-review"

export const PostBookingReviewSchema = z.strictObject({
  rating: z.number().int().min(1).max(5),
  fit: z.enum(["small", "true", "large"]).optional(),
  body: z.string().max(2000).optional(),
  photo_keys: z.array(z.string().min(1)).max(6).optional(),
})

type RequestBody = z.infer<typeof PostBookingReviewSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await submitReviewWorkflow(req.scope).run({
    input: {
      booking_id: req.params.id,
      customer_id: req.auth_context.actor_id,
      ...req.validatedBody,
    },
  })

  res.status(201).json({ review: result.review })
}
