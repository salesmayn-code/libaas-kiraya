import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type LedgerModuleService from "../../../modules/ledger/service"
import type RentalModuleService from "../../../modules/rental/service"

type CreatePayoutInput = {
  vendor_id: string
  period_start: string
  period_end: string
}

export const createPayoutBatchStep = createStep(
  "create-payout-batch",
  async (input: CreatePayoutInput, { container }) => {
    const ledgerService: LedgerModuleService = container.resolve("ledger")
    const rentalService: RentalModuleService = container.resolve("rental")

    const settings = await rentalService.getSettings()
    const balances = await ledgerService.getBalances(input.vendor_id)

    if (balances.available <= 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This vendor has no available balance"
      )
    }

    if (balances.available < Number(settings.min_payout_amount)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Available balance is below the minimum payout of ${settings.min_payout_amount}`
      )
    }

    const payout = await ledgerService.createPayouts({
      vendor_id: input.vendor_id,
      amount: balances.available,
      currency_code: "pkr",
      method: "bank_transfer",
      status: "draft",
      period_start: new Date(`${input.period_start}T00:00:00.000Z`),
      period_end: new Date(`${input.period_end}T00:00:00.000Z`),
    })

    return new StepResponse(payout, payout.id)
  },
  async (payoutId, { container }) => {
    if (!payoutId) {
      return
    }

    const ledgerService: LedgerModuleService = container.resolve("ledger")
    await ledgerService.deletePayouts(payoutId)
  }
)
