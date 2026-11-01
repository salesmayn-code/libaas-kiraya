import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import approveInspectionWorkflow from "../../../../../workflows/rental/approve-inspection"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { result } = await approveInspectionWorkflow(req.scope).run({
    input: {
      inspection_id: req.params.id,
      admin_id: req.auth_context.actor_id,
    },
  })

  res.json({ inspection: result.inspection })
}
