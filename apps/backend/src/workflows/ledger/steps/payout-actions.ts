import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type LedgerModuleService from "../../../modules/ledger/service"
import { sendEmail } from "../../../lib/notify"

type PayoutActionInput = {
  payout_id: string
  admin_id: string
  reference?: string
}

export const approvePayoutStep = createStep(
  "approve-payout",
  async ({ payout_id, admin_id }: PayoutActionInput, { container }) => {
    const ledgerService: LedgerModuleService = container.resolve("ledger")
    const payout = await ledgerService.retrievePayout(payout_id)

    if (payout.status !== "draft") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only a draft payout can be approved")
    }

    const updated = await ledgerService.updatePayouts({
      id: payout.id,
      status: "approved",
      approved_by: admin_id,
      approved_at: new Date(),
    })

    return new StepResponse(updated, {
      id: payout.id,
      status: payout.status,
      approved_by: payout.approved_by,
      approved_at: payout.approved_at,
    })
  },
  async (previous, { container }) => {
    if (!previous) return

    const ledgerService: LedgerModuleService = container.resolve("ledger")
    await ledgerService.updatePayouts({
      id: previous.id,
      status: previous.status as "draft",
      approved_by: previous.approved_by,
      approved_at: previous.approved_at,
    })
  }
)

export const markPayoutPaidStep = createStep(
  "mark-payout-paid",
  async ({ payout_id, reference }: PayoutActionInput, { container }) => {
    const ledgerService: LedgerModuleService = container.resolve("ledger")
    const payout = await ledgerService.retrievePayout(payout_id)

    if (payout.status !== "approved") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Approve the payout before marking it paid"
      )
    }

    const available = await ledgerService.listLedgerEntries({
      vendor_id: payout.vendor_id,
      status: "available",
    })

    const previousEntryIds = available.map((entry) => entry.id)

    for (const entry of available) {
      await ledgerService.updateLedgerEntries({
        id: entry.id,
        status: "paid",
        payout_id: payout.id,
      })
    }

    const updated = await ledgerService.updatePayouts({
      id: payout.id,
      status: "paid",
      reference: reference ?? null,
      paid_at: new Date(),
    })

    try {
      const vendorService = container.resolve("vendor")
      const vendor = await vendorService.retrieveVendor(payout.vendor_id)
      await sendEmail(container, {
        to: vendor.email,
        template: "payout-paid",
        data: {
          payout_id: payout.id,
          amount: Number(payout.amount),
          reference: reference ?? null,
        },
      })
    } catch (error) {
      void error
    }

    return new StepResponse(updated, { payout_id: payout.id, entry_ids: previousEntryIds })
  },
  async (previous, { container }) => {
    if (!previous) return

    const ledgerService: LedgerModuleService = container.resolve("ledger")

    for (const id of previous.entry_ids ?? []) {
      await ledgerService.updateLedgerEntries({
        id,
        status: "available",
        payout_id: null,
      })
    }

    await ledgerService.updatePayouts({
      id: previous.payout_id,
      status: "approved",
      reference: null,
      paid_at: null,
    })
  }
)
