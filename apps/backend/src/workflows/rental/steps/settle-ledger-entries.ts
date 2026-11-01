import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type LedgerModuleService from "../../../modules/ledger/service"
import type RentalModuleService from "../../../modules/rental/service"

type SettleLedgerInput = {
  booking_id: string
  deduction: number
}

export const settleBookingLedgerEntriesStep = createStep(
  "settle-booking-ledger-entries",
  async (input: SettleLedgerInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const ledgerService: LedgerModuleService = container.resolve("ledger")

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    const pending = await ledgerService.listLedgerEntries({
      booking_id: booking.id,
      status: "pending",
    })

    const now = new Date()

    for (const entry of pending) {
      await ledgerService.updateLedgerEntries({
        id: entry.id,
        status: "available",
        available_at: now,
      })
    }

    let deductionEntryId: string | null = null

    if (input.deduction > 0) {
      const [existing] = await ledgerService.listLedgerEntries({
        idempotency_key: `booking:${booking.id}:deduction_earning`,
      })

      if (!existing) {
        const entry = await ledgerService.createLedgerEntries({
          vendor_id: booking.vendor_id,
          booking_id: booking.id,
          type: "deduction_earning",
          amount: input.deduction,
          currency_code: booking.currency_code,
          status: "available",
          available_at: now,
          idempotency_key: `booking:${booking.id}:deduction_earning`,
          memo: "Damage or late deduction",
        })
        deductionEntryId = entry.id
      }
    }

    return new StepResponse(
      { released_ids: pending.map((entry) => entry.id), deduction_entry_id: deductionEntryId },
      {
        released_ids: pending.map((entry) => entry.id),
        deduction_entry_id: deductionEntryId,
      }
    )
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const ledgerService: LedgerModuleService = container.resolve("ledger")

    for (const id of previous.released_ids ?? []) {
      await ledgerService.updateLedgerEntries({
        id,
        status: "pending",
        available_at: null,
      })
    }

    if (previous.deduction_entry_id) {
      await ledgerService.deleteLedgerEntries(previous.deduction_entry_id)
    }
  }
)
