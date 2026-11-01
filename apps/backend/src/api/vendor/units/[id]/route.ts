import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import updateUnitWorkflow from "../../../../workflows/rental/update-unit"

export const PostUpdateUnitSchema = z.strictObject({
  status: z.enum(["active", "maintenance", "retired"]).optional(),
  condition_grade: z.enum(["A", "B", "C"]).optional(),
  notes: z.string().max(500).nullable().optional(),
})

type RequestBody = z.infer<typeof PostUpdateUnitSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await updateUnitWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      unit_id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json({ unit: result.unit })
}
