import { model } from "@medusajs/framework/utils"
import RentalInspection from "./rental-inspection"

const RentalDispute = model
  .define("rental_dispute", {
    id: model.id({ prefix: "rdis" }).primaryKey(),
    inspection: model.belongsTo(() => RentalInspection, {
      mappedBy: "dispute",
    }),
    booking_id: model.text(),
    opened_by: model.text(),
    reason: model.text(),
    evidence_keys: model.array().nullable(),
    status: model.enum(["open", "under_review", "resolved"]).default("open"),
    resolution: model.enum(["customer", "vendor", "split"]).nullable(),
    resolved_deduction: model.bigNumber().nullable(),
    admin_notes: model.text().nullable(),
    resolved_by: model.text().nullable(),
    opened_at: model.dateTime(),
    resolved_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["inspection_id"], unique: true }])

export default RentalDispute
