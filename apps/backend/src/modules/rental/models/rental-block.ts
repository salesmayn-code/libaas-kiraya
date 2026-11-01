import { model } from "@medusajs/framework/utils"
import RentalUnit from "./rental-unit"

const RentalBlock = model
  .define("rental_block", {
    id: model.id({ prefix: "rblk" }).primaryKey(),
    unit: model.belongsTo(() => RentalUnit, {
      mappedBy: "blocks",
    }),
    vendor_id: model.text(),
    start_date: model.dateTime(),
    end_date: model.dateTime(),
    reason: model.enum(["maintenance", "offline_rental", "other"]),
    note: model.text().nullable(),
  })
  .indexes([{ on: ["vendor_id", "start_date"] }])

export default RentalBlock
