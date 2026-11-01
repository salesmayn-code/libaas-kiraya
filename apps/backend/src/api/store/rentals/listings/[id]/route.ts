import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "rental_listing",
    fields: [
      "id",
      "city",
      "base_amount",
      "base_days",
      "extra_day_amount",
      "cleaning_fee_amount",
      "deposit_amount",
      "late_fee_amount",
      "lead_buffer_days",
      "return_buffer_days",
      "min_days",
      "max_days",
      "fulfillment_modes",
      "cancellation_policy",
      "occasion_tags",
      "rating_avg",
      "rating_count",
      "fit_small_count",
      "fit_true_count",
      "fit_large_count",
      "product.id",
      "product.title",
      "product.handle",
      "product.description",
      "product.thumbnail",
      "product.images.url",
      "product.vendor.id",
      "product.vendor.name",
      "product.vendor.handle",
      "product.vendor.city",
      "product.vendor.description",
      "product.vendor.instagram_handle",
      "variants.id",
      "variants.size_label",
      "variants.measurements",
      "variants.alterable",
      "variants.alteration_notes",
      "units.id",
      "units.status",
    ],
    filters: { id: req.params.id, status: "active" },
  })

  const listing = data[0]

  if (!listing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing not found")
  }

  res.json({ listing })
}
