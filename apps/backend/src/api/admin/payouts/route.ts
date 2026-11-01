import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import createPayoutBatchWorkflow from "../../../workflows/ledger/create-payout-batch"
import type LedgerModuleService from "../../../modules/ledger/service"

export const PostCreatePayoutSchema = z.strictObject({
  vendor_id: z.string().min(1),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

type CreatePayoutBody = z.infer<typeof PostCreatePayoutSchema>

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const ledgerService: LedgerModuleService = req.scope.resolve("ledger")

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const status = typeof req.query.status === "string" ? req.query.status : undefined

  const filters: Record<string, unknown> = {}

  if (status) filters.status = status

  const [payouts, count] = await ledgerService.listAndCountPayouts(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })

  res.json({ payouts, count, offset, limit })
}

export async function POST(req: AuthenticatedMedusaRequest<CreatePayoutBody>, res: MedusaResponse) {
  const { result } = await createPayoutBatchWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ payout: result.payout })
}
