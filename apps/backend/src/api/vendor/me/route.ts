import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor_user",
    fields: [
      "id",
      "name",
      "email",
      "role",
      "vendor.id",
      "vendor.name",
      "vendor.handle",
      "vendor.status",
      "vendor.city",
      "vendor.commission_bps",
      "vendor.default_cancellation_policy",
      "vendor.payout_method",
    ],
    filters: {
      id: req.auth_context.actor_id,
    },
  })

  const vendorUser = data[0]

  if (!vendorUser) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
  }

  res.json({
    vendor_user: {
      id: vendorUser.id,
      name: vendorUser.name,
      email: vendorUser.email,
      role: vendorUser.role,
    },
    vendor: vendorUser.vendor,
  })
}
