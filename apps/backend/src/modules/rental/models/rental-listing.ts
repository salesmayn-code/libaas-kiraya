import { model } from "@medusajs/framework/utils"
import RentalBooking from "./rental-booking"
import RentalUnit from "./rental-unit"
import RentalVariantSpec from "./rental-variant-spec"

const RentalListing = model
  .define("rental_listing", {
    id: model.id({ prefix: "rlst" }).primaryKey(),
    product_id: model.text().unique(),
    vendor_id: model.text(),
    city: model.text(),
    status: model.enum(["draft", "active", "paused"]).default("draft"),
    base_amount: model.bigNumber(),
    base_days: model.number().default(3),
    extra_day_amount: model.bigNumber(),
    cleaning_fee_amount: model.bigNumber().default(0),
    deposit_amount: model.bigNumber(),
    late_fee_amount: model.bigNumber(),
    lead_buffer_days: model.number().default(1),
    return_buffer_days: model.number().default(2),
    min_days: model.number().default(1),
    max_days: model.number().default(7),
    fulfillment_modes: model.array(),
    cancellation_policy: model
      .enum(["flexible", "standard", "strict"])
      .default("standard"),
    occasion_tags: model.array().nullable(),
    rating_avg: model.float().default(0),
    rating_count: model.number().default(0),
    fit_small_count: model.number().default(0),
    fit_true_count: model.number().default(0),
    fit_large_count: model.number().default(0),
    variants: model.hasMany(() => RentalVariantSpec, {
      mappedBy: "listing",
    }),
    units: model.hasMany(() => RentalUnit, {
      mappedBy: "listing",
    }),
    bookings: model.hasMany(() => RentalBooking, {
      mappedBy: "listing",
    }),
  })
  .indexes([
    { on: ["city", "status"] },
    { on: ["vendor_id", "status"] },
  ])

export default RentalListing
