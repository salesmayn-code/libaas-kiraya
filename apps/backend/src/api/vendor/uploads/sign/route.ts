import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { createSignedUpload } from "../../../../lib/storage"

export const PostVendorUploadSignSchema = z.strictObject({
  filename: z.string().min(1).max(200),
  content_type: z.string().min(1).max(100),
  size: z.number().int().positive().max(10 * 1024 * 1024),
  scope: z.enum(["catalog", "private"]),
})

type RequestBody = z.infer<typeof PostVendorUploadSignSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor_user",
    fields: ["vendor.id", "vendor.status"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendor = data[0]?.vendor

  if (!vendor) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
  }

  if (vendor.status !== "active") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Your boutique must be approved before uploading files"
    )
  }

  const body = req.validatedBody

  const result = await createSignedUpload({
    vendorId: vendor.id,
    filename: body.filename,
    contentType: body.content_type,
    size: body.size,
    scope: body.scope,
  })

  res.status(201).json(result)
}
