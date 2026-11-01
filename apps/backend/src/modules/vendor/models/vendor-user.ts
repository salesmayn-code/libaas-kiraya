import { model } from "@medusajs/framework/utils"
import Vendor from "./vendor"

const VendorUser = model.define("vendor_user", {
  id: model.id({ prefix: "vusr" }).primaryKey(),
  vendor: model.belongsTo(() => Vendor, {
    mappedBy: "users",
  }),
  auth_identity_id: model.text().unique(),
  name: model.text(),
  email: model.text().unique(),
  role: model.enum(["owner", "staff"]).default("owner"),
})

export default VendorUser
