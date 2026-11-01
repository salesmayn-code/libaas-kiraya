import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import publishListingWorkflow from "../../../../../workflows/rental/publish-listing"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { result } = await publishListingWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      listing_id: req.params.id,
    },
  })

  res.json({ listing: result.listing })
}
