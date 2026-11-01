import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type LedgerModuleService from "../../../modules/ledger/service"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const ledgerService: LedgerModuleService = req.scope.resolve("ledger")

  const { data: vendorUsers } = await query.graph({
    entity: "vendor_user",
    fields: ["vendor.id"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendorId = vendorUsers[0]?.vendor?.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const balances = await ledgerService.getBalances(vendorId)

  const [entries, count] = await ledgerService.listAndCountLedgerEntries(
    { vendor_id: vendorId },
    { take: limit, skip: offset, order: { created_at: "DESC" } }
  )

  const payouts = await ledgerService.listPayouts(
    { vendor_id: vendorId },
    { order: { created_at: "DESC" } }
  )

  res.json({ balances, entries, payouts, count, offset, limit })
}
