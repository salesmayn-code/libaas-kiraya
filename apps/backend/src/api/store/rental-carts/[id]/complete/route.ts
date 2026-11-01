import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import completeRentalCartWorkflow from "../../../../../workflows/rental/complete-rental-cart"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { result } = await completeRentalCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.json({ order_id: result.order_id })
}
