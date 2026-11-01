import { model } from "@medusajs/framework/utils"

const RentalSetting = model.define("rental_setting", {
  id: model.id({ prefix: "rset" }).primaryKey(),
  hold_ttl_minutes: model.number().default(15),
  max_active_holds: model.number().default(3),
  inspection_window_hours: model.number().default(48),
  dispute_window_hours: model.number().default(72),
  default_lead_buffer_days: model.number().default(1),
  default_return_buffer_days: model.number().default(2),
  default_commission_bps: model.number().default(1200),
  admin_review_deduction_pct: model.number().default(50),
  min_payout_amount: model.bigNumber().default(5000),
  vendor_cancel_penalty_amount: model.bigNumber().default(2000),
})

export default RentalSetting
