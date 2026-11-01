import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import markDispatchedWorkflow from "../../../../../workflows/rental/mark-dispatched"

export const PostVendorDispatchSchema = z.strictObject({
  photo_keys: z.array(z.string().min(1)).max(12).optional(),
})

type RequestBody = z.infer<typeof PostVendorDispatchSchema>

export async function POST(req: AuthenticatedMedusaRequest<RequestBody>, res: MedusaResponse) {
  const { result } = await markDispatchedWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      booking_id: req.params.id,
      photo_keys: req.validatedBody.photo_keys,
    },
  })

  res.json({ booking: result.booking })
}
