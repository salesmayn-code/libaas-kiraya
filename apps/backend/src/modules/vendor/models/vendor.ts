import { model } from "@medusajs/framework/utils"
import VendorUser from "./vendor-user"

const Vendor = model.define("vendor", {
  id: model.id({ prefix: "ven" }).primaryKey(),
  name: model.text(),
  handle: model.text().unique(),
  email: model.text().unique(),
  phone: model.text(),
  whatsapp: model.text().nullable(),
  city: model.text(),
  address: model.text().nullable(),
  description: model.text().nullable(),
  logo_key: model.text().nullable(),
  instagram_handle: model.text().nullable(),
  status: model
    .enum(["pending", "active", "suspended", "rejected"])
    .default("pending"),
  kyc_status: model
    .enum(["not_submitted", "submitted", "verified", "rejected"])
    .default("not_submitted"),
  kyc_document_keys: model.array().nullable(),
  commission_bps: model.number().default(1200),
  default_cancellation_policy: model
    .enum(["flexible", "standard", "strict"])
    .default("standard"),
  payout_method: model
    .enum(["bank_transfer", "jazzcash", "easypaisa"])
    .nullable(),
  payout_account_ref: model.text().nullable(),
  cancellations_90d: model.number().default(0),
  metadata: model.json().nullable(),
  users: model.hasMany(() => VendorUser, {
    mappedBy: "vendor",
  }),
})

export default Vendor
