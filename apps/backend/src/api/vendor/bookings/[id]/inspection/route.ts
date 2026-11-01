import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import submitInspectionWorkflow from "../../../../../workflows/rental/submit-inspection"

export const PostVendorInspectionSchema = z.strictObject({
  outcome: z.enum(["clean", "minor_damage", "major_damage", "loss"]),
  damage_deduction: z.number().nonnegative(),
  notes: z.string().max(2000).optional(),
  photo_keys: z.array(z.string().min(1)).max(12).default([]),
})

type RequestBody = z.infer<typeof PostVendorInspectionSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await submitInspectionWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      booking_id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.status(201).json({ inspection: result.inspection })
}
