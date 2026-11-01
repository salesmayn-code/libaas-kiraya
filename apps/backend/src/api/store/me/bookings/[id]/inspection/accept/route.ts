import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import acceptInspectionWorkflow from "../../../../../../../workflows/rental/accept-inspection"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { result } = await acceptInspectionWorkflow(req.scope).run({
    input: {
      booking_id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.json(result)
}
