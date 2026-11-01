import { model } from "@medusajs/framework/utils"
import RentalListing from "./rental-listing"

const RentalVariantSpec = model.define("rental_variant_spec", {
  id: model.id({ prefix: "rspec" }).primaryKey(),
  listing: model.belongsTo(() => RentalListing, {
    mappedBy: "variants",
  }),
  variant_id: model.text().unique(),
  size_label: model.text(),
  measurements: model.json(),
  alterable: model.boolean().default(false),
  alteration_notes: model.text().nullable(),
})

export default RentalVariantSpec
