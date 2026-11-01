import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import addUnitWorkflow from "../../../../../workflows/rental/add-unit"

export const PostVendorUnitSchema = z.strictObject({
  size_label: z.string().min(1).max(30),
  tag_code: z.string().min(1).max(40),
  condition_grade: z.enum(["A", "B", "C"]).default("A"),
  notes: z.string().max(500).optional(),
})

type RequestBody = z.infer<typeof PostVendorUnitSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await addUnitWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      listing_id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.status(201).json({ unit: result.unit })
}
