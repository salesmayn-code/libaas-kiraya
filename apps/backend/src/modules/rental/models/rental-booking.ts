import { model } from "@medusajs/framework/utils"
import RentalBookingEvent from "./rental-booking-event"
import RentalDeposit from "./rental-deposit"
import RentalInspection from "./rental-inspection"
import RentalListing from "./rental-listing"
import RentalUnit from "./rental-unit"

const RentalBooking = model
  .define("rental_booking", {
    id: model.id({ prefix: "rbk" }).primaryKey(),
    listing: model.belongsTo(() => RentalListing, {
      mappedBy: "bookings",
    }),
    unit: model.belongsTo(() => RentalUnit, {
      mappedBy: "bookings",
    }),
    variant_id: model.text(),
    vendor_id: model.text(),
    customer_id: model.text(),
    cart_id: model.text().nullable(),
    order_id: model.text().nullable(),
    line_item_id: model.text().nullable(),
    event_date: model.dateTime(),
    rental_start: model.dateTime(),
    rental_end: model.dateTime(),
    blocked_start: model.dateTime(),
    blocked_end: model.dateTime(),
    days: model.number(),
    status: model
      .enum([
        "held",
        "confirmed",
        "with_customer",
        "returned",
        "settling",
        "disputed",
        "completed",
        "cancelled",
        "expired",
      ])
      .default("held"),
    ops_flag: model
      .enum(["none", "overdue", "at_risk", "settlement_failed", "cancel_failed"])
      .default("none"),
    hold_expires_at: model.dateTime().nullable(),
    fulfillment_mode: model.enum(["pickup", "courier"]),
    delivery_address: model.json().nullable(),
    currency_code: model.text(),
    rental_fee: model.bigNumber(),
    cleaning_fee: model.bigNumber(),
    deposit_amount: model.bigNumber(),
    platform_fee: model.bigNumber(),
    pricing_snapshot: model.json(),
    cancelled_by: model.enum(["customer", "vendor", "admin", "system"]).nullable(),
    cancellation_reason: model.text().nullable(),
    cancelled_at: model.dateTime().nullable(),
    dispatched_at: model.dateTime().nullable(),
    returned_at: model.dateTime().nullable(),
    inspection_due_at: model.dateTime().nullable(),
    completed_at: model.dateTime().nullable(),
    events: model.hasMany(() => RentalBookingEvent, {
      mappedBy: "booking",
    }),
    deposit: model.hasOne(() => RentalDeposit, {
      mappedBy: "booking",
    }),
    inspection: model.hasOne(() => RentalInspection, {
      mappedBy: "booking",
    }),
  })
  .indexes([
    { on: ["vendor_id", "status", "rental_start"] },
    { on: ["customer_id", "status"] },
    { on: ["order_id"] },
    { on: ["status", "hold_expires_at"], where: "status = 'held'" },
    { on: ["status", "inspection_due_at"], where: "status = 'returned'" },
    { on: ["status", "rental_end"], where: "status = 'with_customer'" },
  ])

export default RentalBooking
