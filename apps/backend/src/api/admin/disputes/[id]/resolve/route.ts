import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import resolveDisputeWorkflow from "../../../../../workflows/rental/resolve-dispute"

export const PostResolveDisputeSchema = z.strictObject({
  resolution: z.enum(["customer", "vendor", "split"]),
  resolved_deduction: z.number().nonnegative().default(0),
  admin_notes: z.string().max(2000).optional(),
})

type RequestBody = z.infer<typeof PostResolveDisputeSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await resolveDisputeWorkflow(req.scope).run({
    input: {
      dispute_id: req.params.id,
      admin_id: req.auth_context.actor_id,
      ...req.validatedBody,
    },
  })

  res.json(result)
}
