import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import releaseRentalHoldWorkflow from "../../../../../../workflows/rental/release-hold"

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await releaseRentalHoldWorkflow(req.scope).run({
    input: {
      booking_id: req.params.booking_id,
      cart_id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.json(result)
}
