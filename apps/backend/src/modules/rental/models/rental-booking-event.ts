import { model } from "@medusajs/framework/utils"
import RentalBooking from "./rental-booking"

const RentalBookingEvent = model
  .define("rental_booking_event", {
    id: model.id({ prefix: "rbe" }).primaryKey(),
    booking: model.belongsTo(() => RentalBooking, {
      mappedBy: "events",
    }),
    from_status: model.text().nullable(),
    to_status: model.text(),
    actor_type: model.enum(["customer", "vendor", "admin", "system"]),
    actor_id: model.text().nullable(),
    meta: model.json().nullable(),
  })
  .indexes([{ on: ["booking_id", "created_at"] }])

export default RentalBookingEvent
