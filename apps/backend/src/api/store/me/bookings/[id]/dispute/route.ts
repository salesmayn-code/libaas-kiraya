import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import disputeInspectionWorkflow from "../../../../../../workflows/rental/dispute-inspection"

export const PostBookingDisputeSchema = z.strictObject({
  reason: z.string().min(5).max(1000),
  evidence_keys: z.array(z.string().min(1)).max(12).optional(),
})

type RequestBody = z.infer<typeof PostBookingDisputeSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await disputeInspectionWorkflow(req.scope).run({
    input: {
      booking_id: req.params.id,
      customer_id: req.auth_context.actor_id,
      ...req.validatedBody,
    },
  })

  res.status(201).json({ dispute: result.dispute })
}
