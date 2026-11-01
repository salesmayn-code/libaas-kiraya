import { model } from "@medusajs/framework/utils"

const MeasurementProfile = model
  .define("measurement_profile", {
    id: model.id({ prefix: "mprof" }).primaryKey(),
    customer_id: model.text(),
    label: model.text(),
    garment_type: model.enum(["women", "men", "kids"]).default("women"),
    unit: model.enum(["in", "cm"]).default("in"),
    bust_chest: model.float().nullable(),
    waist: model.float().nullable(),
    hips: model.float().nullable(),
    shoulder: model.float().nullable(),
    height: model.float().nullable(),
    is_default: model.boolean().default(false),
    notes: model.text().nullable(),
  })
  .indexes([{ on: ["customer_id"] }])

export default MeasurementProfile
