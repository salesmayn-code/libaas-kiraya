import { model } from "@medusajs/framework/utils"
import RentalBlock from "./rental-block"
import RentalBooking from "./rental-booking"
import RentalListing from "./rental-listing"

const RentalUnit = model
  .define("rental_unit", {
    id: model.id({ prefix: "runit" }).primaryKey(),
    listing: model.belongsTo(() => RentalListing, {
      mappedBy: "units",
    }),
    variant_id: model.text(),
    vendor_id: model.text(),
    tag_code: model.text(),
    condition_grade: model.enum(["A", "B", "C"]).default("A"),
    status: model.enum(["active", "maintenance", "retired"]).default("active"),
    last_booked_at: model.dateTime().nullable(),
    notes: model.text().nullable(),
    bookings: model.hasMany(() => RentalBooking, {
      mappedBy: "unit",
    }),
    blocks: model.hasMany(() => RentalBlock, {
      mappedBy: "unit",
    }),
  })
  .indexes([
    { on: ["listing_id", "variant_id", "status"] },
    { on: ["vendor_id", "tag_code"], unique: true },
  ])

export default RentalUnit
