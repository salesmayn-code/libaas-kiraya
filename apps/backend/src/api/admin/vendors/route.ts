import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const status = typeof req.query.status === "string" ? req.query.status : undefined

  const filters: Record<string, unknown> = {}

  if (status) {
    filters.status = status
  }

  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "name",
      "handle",
      "email",
      "phone",
      "city",
      "status",
      "kyc_status",
      "kyc_document_keys",
      "commission_bps",
      "default_cancellation_policy",
      "cancellations_90d",
      "created_at",
      "users.id",
      "users.name",
      "users.email",
      "users.role",
    ],
    filters,
    pagination: {
      skip: offset,
      take: limit,
    },
  })

  res.json({
    vendors,
    count: vendors.length,
    offset,
    limit,
  })
}
