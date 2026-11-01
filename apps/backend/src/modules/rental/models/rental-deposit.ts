import { model } from "@medusajs/framework/utils"
import RentalBooking from "./rental-booking"

const RentalDeposit = model
  .define("rental_deposit", {
    id: model.id({ prefix: "rdep" }).primaryKey(),
    booking: model.belongsTo(() => RentalBooking, {
      mappedBy: "deposit",
    }),
    mode: model.enum(["hold", "charge_refund"]),
    amount: model.bigNumber(),
    status: model
      .enum(["pending", "secured", "settled", "released", "failed"])
      .default("pending"),
    payment_collection_id: model.text().nullable(),
    captured_amount: model.bigNumber().default(0),
    released_amount: model.bigNumber().default(0),
    authorization_expires_at: model.dateTime().nullable(),
    secured_at: model.dateTime().nullable(),
    settled_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["booking_id"], unique: true }])

export default RentalDeposit
