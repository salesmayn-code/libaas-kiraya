import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type LedgerModuleService from "../../../modules/ledger/service"
import type RentalModuleService from "../../../modules/rental/service"

type CreateBookingLedgerInput = {
  booking_ids: string[]
}

type LedgerEntryInput = {
  vendor_id: string
  booking_id: string
  type:
    | "rental_earning"
    | "commission"
    | "cleaning_fee"
    | "deduction_earning"
    | "refund_reversal"
    | "penalty"
    | "adjustment"
    | "payout"
  amount: number
  currency_code: string
  status: "pending" | "available" | "paid" | "reversed"
  idempotency_key: string
  memo: string
}

export const createBookingLedgerEntriesStep = createStep(
  "create-booking-ledger-entries",
  async (input: CreateBookingLedgerInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const ledgerService: LedgerModuleService = container.resolve("ledger")

    const createdIds: string[] = []

    for (const bookingId of input.booking_ids) {
      const booking = await rentalService.retrieveRentalBooking(bookingId)
      const rentalFee = Number(booking.rental_fee)
      const cleaningFee = Number(booking.cleaning_fee)
      const platformFee = Number(booking.platform_fee)

      const entries: LedgerEntryInput[] = [
        {
          vendor_id: booking.vendor_id,
          booking_id: booking.id,
          type: "rental_earning" as const,
          amount: rentalFee,
          currency_code: booking.currency_code,
          status: "pending" as const,
          idempotency_key: `booking:${booking.id}:rental_earning`,
          memo: "Rental fee earned",
        },
        {
          vendor_id: booking.vendor_id,
          booking_id: booking.id,
          type: "commission" as const,
          amount: -platformFee,
          currency_code: booking.currency_code,
          status: "pending" as const,
          idempotency_key: `booking:${booking.id}:commission`,
          memo: "Platform commission",
        },
      ]

      if (cleaningFee > 0) {
        entries.push({
          vendor_id: booking.vendor_id,
          booking_id: booking.id,
          type: "cleaning_fee" as const,
          amount: cleaningFee,
          currency_code: booking.currency_code,
          status: "pending" as const,
          idempotency_key: `booking:${booking.id}:cleaning_fee`,
          memo: "Cleaning fee",
        })
      }

      const validEntries = entries.filter((entry) => entry.amount !== 0)

      if (!validEntries.length) {
        continue
      }

      const existing = await ledgerService.listLedgerEntries({
        idempotency_key: validEntries.map((entry) => entry.idempotency_key),
      })

      const existingKeys = new Set(existing.map((entry) => entry.idempotency_key))
      const toCreate = validEntries.filter(
        (entry) => !existingKeys.has(entry.idempotency_key)
      )

      if (!toCreate.length) {
        continue
      }

      const created = await ledgerService.createLedgerEntries(toCreate)
      createdIds.push(...created.map((entry) => entry.id))
    }

    return new StepResponse({ ids: createdIds }, createdIds)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const ledgerService: LedgerModuleService = container.resolve("ledger")
    await ledgerService.deleteLedgerEntries(ids)
  }
)
