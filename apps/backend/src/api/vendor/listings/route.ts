import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import type RentalModuleService from "../../../modules/rental/service"
import createListingWorkflow from "../../../workflows/rental/create-listing"

const MeasurementsSchema = z.record(z.string(), z.number().positive())

export const PostVendorListingSchema = z.strictObject({
  title: z.string().min(3).max(160),
  description: z.string().max(4000).optional(),
  images: z.array(z.url()).min(1).max(10),
  city: z.string().min(2).max(80),
  base_amount: z.number().nonnegative(),
  base_days: z.number().int().min(1).max(30),
  extra_day_amount: z.number().nonnegative(),
  cleaning_fee_amount: z.number().nonnegative(),
  deposit_amount: z.number().nonnegative(),
  late_fee_amount: z.number().nonnegative(),
  lead_buffer_days: z.number().int().min(0).max(14).optional(),
  return_buffer_days: z.number().int().min(0).max(14).optional(),
  min_days: z.number().int().min(1).max(30),
  max_days: z.number().int().min(1).max(30),
  fulfillment_modes: z.array(z.enum(["pickup", "courier"])).min(1),
  cancellation_policy: z.enum(["flexible", "standard", "strict"]),
  occasion_tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  variants: z
    .array(
      z.strictObject({
        size_label: z.string().min(1).max(30),
        measurements: MeasurementsSchema,
        alterable: z.boolean().default(false),
        alteration_notes: z.string().max(500).optional(),
      })
    )
    .min(1),
  units: z
    .array(
      z.strictObject({
        size_label: z.string().min(1).max(30),
        tag_code: z.string().min(1).max(40),
        condition_grade: z.enum(["A", "B", "C"]).default("A"),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1),
})

type CreateListingBody = z.infer<typeof PostVendorListingSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<CreateListingBody>,
  res: MedusaResponse
) {
  const { result } = await createListingWorkflow(req.scope).run({
    input: {
      vendor_user_id: req.auth_context.actor_id,
      listing: req.validatedBody,
    },
  })

  res.status(201).json({
    listing: result.listing,
    product: result.product,
    units: result.units,
  })
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const rentalService = req.scope.resolve<RentalModuleService>("rental")

  const { data: vendorUsers } = await query.graph({
    entity: "vendor_user",
    fields: ["vendor.id"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendorId = vendorUsers[0]?.vendor?.id

  if (!vendorId) {
    res.status(404).json({ message: "Vendor account not found" })
    return
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const status = typeof req.query.status === "string" ? req.query.status : undefined

  const filters: Record<string, unknown> = { vendor_id: vendorId }

  if (status) {
    filters.status = status
  }

  const [, count] = await rentalService.listAndCountRentalListings(filters)

  const { data: listings } = await query.graph({
    entity: "rental_listing",
    fields: [
      "id",
      "city",
      "status",
      "base_amount",
      "deposit_amount",
      "created_at",
      "product.id",
      "product.title",
      "product.thumbnail",
      "variants.id",
      "variants.size_label",
      "units.id",
      "units.status",
      "units.tag_code",
    ],
    filters,
    pagination: { skip: offset, take: limit },
  })

  res.json({
    listings,
    count,
    offset,
    limit,
  })
}
