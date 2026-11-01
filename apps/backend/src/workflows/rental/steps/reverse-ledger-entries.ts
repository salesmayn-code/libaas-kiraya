import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type LedgerModuleService from "../../../modules/ledger/service"

type ReverseLedgerInput = {
  booking_id: string
}

export const reverseBookingLedgerEntriesStep = createStep(
  "reverse-booking-ledger-entries",
  async (input: ReverseLedgerInput, { container }) => {
    const ledgerService: LedgerModuleService = container.resolve("ledger")

    const pending = await ledgerService.listLedgerEntries({
      booking_id: input.booking_id,
      status: "pending",
    })

    for (const entry of pending) {
      await ledgerService.updateLedgerEntries({
        id: entry.id,
        status: "reversed",
      })
    }

    return new StepResponse(
      { reversed_ids: pending.map((entry) => entry.id) },
      pending.map((entry) => entry.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const ledgerService: LedgerModuleService = container.resolve("ledger")

    for (const id of ids) {
      await ledgerService.updateLedgerEntries({
        id,
        status: "pending",
      })
    }
  }
)
