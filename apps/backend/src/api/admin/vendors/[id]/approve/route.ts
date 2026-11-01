import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import approveVendorWorkflow from "../../../../../workflows/vendor/approve-vendor"

export const PostApproveVendorSchema = z.strictObject({
  commission_bps: z.number().int().min(0).max(3000).optional(),
})

type RequestBody = z.infer<typeof PostApproveVendorSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await approveVendorWorkflow(req.scope).run({
    input: {
      vendor_id: req.params.id,
      commission_bps: req.validatedBody.commission_bps,
    },
  })

  res.json({ vendor: result.vendor })
}
