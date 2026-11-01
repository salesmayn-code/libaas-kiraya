import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import updateListingWorkflow from "../../../../workflows/rental/update-listing"

export const UpdateVendorListingSchema = z.strictObject({
  title: z.string().min(3).max(160).optional(),
  description: z.string().max(4000).optional(),
  images: z.array(z.url()).min(1).max(10).optional(),
  city: z.string().min(2).max(80).optional(),
  base_amount: z.number().nonnegative().optional(),
  base_days: z.number().int().min(1).max(30).optional(),
  extra_day_amount: z.number().nonnegative().optional(),
  cleaning_fee_amount: z.number().nonnegative().optional(),
  deposit_amount: z.number().nonnegative().optional(),
  late_fee_amount: z.number().nonnegative().optional(),
  lead_buffer_days: z.number().int().min(0).max(14).optional(),
  return_buffer_days: z.number().int().min(0).max(14).optional(),
  min_days: z.number().int().min(1).max(30).optional(),
  max_days: z.number().int().min(1).max(30).optional(),
  fulfillment_modes: z.array(z.enum(["pickup", "courier"])).min(1).optional(),
  cancellation_policy: z.enum(["flexible", "standard", "strict"]).optional(),
  occasion_tags: z.array(z.string().min(1).max(30)).max(10).optional(),
})

type RequestBody = z.infer<typeof UpdateVendorListingSchema>

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendorUsers } = await query.graph({
    entity: "vendor_user",
    fields: ["vendor.id"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendorId = vendorUsers[0]?.vendor?.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
  }

  const { data } = await query.graph({
    entity: "rental_listing",
    fields: [
      "*",
      "product.id",
      "product.title",
      "product.description",
      "product.thumbnail",
      "product.images.url",
      "product.status",
      "variants.*",
      "units.*",
    ],
    filters: { id: req.params.id, vendor_id: vendorId },
  })

  const listing = data[0]

  if (!listing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing not found")
  }

  res.json({ listing })
}

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const { result } = await updateListingWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      listing_id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json({ listing: result.listing })
}
