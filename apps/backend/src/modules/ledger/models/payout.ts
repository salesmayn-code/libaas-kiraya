import { model } from "@medusajs/framework/utils"

const Payout = model
  .define("payout", {
    id: model.id({ prefix: "pay" }).primaryKey(),
    vendor_id: model.text(),
    amount: model.bigNumber(),
    currency_code: model.text(),
    method: model.enum(["bank_transfer", "jazzcash", "easypaisa"]),
    reference: model.text().nullable(),
    status: model.enum(["draft", "approved", "paid", "failed"]).default("draft"),
    period_start: model.dateTime(),
    period_end: model.dateTime(),
    approved_by: model.text().nullable(),
    approved_at: model.dateTime().nullable(),
    paid_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["vendor_id", "status"] }])

export default Payout
