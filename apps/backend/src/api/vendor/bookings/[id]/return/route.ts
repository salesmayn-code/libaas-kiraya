import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import markReturnedWorkflow from "../../../../../workflows/rental/mark-returned"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await markReturnedWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      booking_id: req.params.id,
    },
  })

  res.json({ booking: result.booking })
}
