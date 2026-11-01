import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import markPayoutPaidWorkflow from "../../../../../workflows/ledger/mark-payout-paid"

export const PostMarkPayoutPaidSchema = z.strictObject({
  reference: z.string().min(1).max(120),
})

type RequestBody = z.infer<typeof PostMarkPayoutPaidSchema>

export async function POST(req: AuthenticatedMedusaRequest<RequestBody>, res: MedusaResponse) {
  const { result } = await markPayoutPaidWorkflow(req.scope).run({
    input: {
      payout_id: req.params.id,
      admin_id: req.auth_context.actor_id,
      reference: req.validatedBody.reference,
    },
  })

  res.json({ payout: result.payout })
}
