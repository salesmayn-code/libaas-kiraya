import { model } from "@medusajs/framework/utils"

const LedgerEntry = model
  .define("ledger_entry", {
    id: model.id({ prefix: "led" }).primaryKey(),
    vendor_id: model.text(),
    booking_id: model.text().nullable(),
    payout_id: model.text().nullable(),
    type: model.enum([
      "rental_earning",
      "commission",
      "cleaning_fee",
      "deduction_earning",
      "refund_reversal",
      "penalty",
      "adjustment",
      "payout",
    ]),
    amount: model.bigNumber(),
    currency_code: model.text(),
    status: model.enum(["pending", "available", "paid", "reversed"]).default("pending"),
    available_at: model.dateTime().nullable(),
    idempotency_key: model.text().unique(),
    memo: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["vendor_id", "status"] },
    { on: ["booking_id"] },
  ])

export default LedgerEntry
