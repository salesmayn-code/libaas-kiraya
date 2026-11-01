import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import approvePayoutWorkflow from "../../../../../workflows/ledger/approve-payout"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await approvePayoutWorkflow(req.scope).run({
    input: {
      payout_id: req.params.id,
      admin_id: req.auth_context.actor_id,
    },
  })

  res.json({ payout: result.payout })
}
