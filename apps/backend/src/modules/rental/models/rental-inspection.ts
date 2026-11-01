import { model } from "@medusajs/framework/utils"
import RentalBooking from "./rental-booking"
import RentalDispute from "./rental-dispute"

const RentalInspection = model
  .define("rental_inspection", {
    id: model.id({ prefix: "rins" }).primaryKey(),
    booking: model.belongsTo(() => RentalBooking, {
      mappedBy: "inspection",
    }),
    filed_by: model.text(),
    outcome: model.enum(["clean", "minor_damage", "major_damage", "loss"]),
    damage_deduction: model.bigNumber().default(0),
    late_days: model.number().default(0),
    late_fee: model.bigNumber().default(0),
    total_deduction: model.bigNumber(),
    notes: model.text().nullable(),
    photo_keys: model.array(),
    status: model
      .enum([
        "submitted",
        "needs_admin_review",
        "accepted",
        "auto_accepted",
        "disputed",
        "resolved",
      ])
      .default("submitted"),
    submitted_at: model.dateTime(),
    dispute_deadline: model.dateTime(),
    decided_at: model.dateTime().nullable(),
    dispute: model.hasOne(() => RentalDispute, {
      mappedBy: "inspection",
    }),
  })
  .indexes([
    { on: ["booking_id"], unique: true },
    { on: ["status", "dispute_deadline"] },
  ])

export default RentalInspection
