import { model } from "@medusajs/framework/utils"

const Review = model
  .define("review", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    booking_id: model.text().unique(),
    customer_id: model.text(),
    vendor_id: model.text(),
    listing_id: model.text(),
    rating: model.number(),
    fit: model.enum(["small", "true", "large"]).nullable(),
    body: model.text().nullable(),
    photo_keys: model.array().nullable(),
    status: model.enum(["published", "hidden"]).default("published"),
  })
  .indexes([{ on: ["listing_id", "status", "created_at"] }])

export default Review
