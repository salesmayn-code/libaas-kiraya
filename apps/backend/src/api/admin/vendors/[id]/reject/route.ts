import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import rejectVendorWorkflow from "../../../../../workflows/vendor/reject-vendor"

export const PostRejectVendorSchema = z.strictObject({
  reason: z.string().min(3).max(500),
})

type RequestBody = z.infer<typeof PostRejectVendorSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await rejectVendorWorkflow(req.scope).run({
    input: {
      vendor_id: req.params.id,
      reason: req.validatedBody.reason,
    },
  })

  res.json({ vendor: result.vendor })
}
