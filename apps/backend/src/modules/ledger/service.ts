import { MedusaService } from "@medusajs/framework/utils"
import LedgerEntry from "./models/ledger-entry"
import Payout from "./models/payout"

class LedgerModuleService extends MedusaService({
  LedgerEntry,
  Payout,
}) {
  async getBalances(vendorId: string) {
    const entries = await this.listLedgerEntries({ vendor_id: vendorId })

    const totals = {
      pending: 0,
      available: 0,
      paid: 0,
    }

    for (const entry of entries) {
      if (entry.status === "pending") totals.pending += Number(entry.amount)
      if (entry.status === "available") totals.available += Number(entry.amount)
      if (entry.status === "paid") totals.paid += Number(entry.amount)
    }

    return totals
  }
}

export default LedgerModuleService
