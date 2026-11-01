import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import onboardVendorWorkflow from "../../../workflows/vendor/onboard-vendor"

export const PostVendorRegisterSchema = z.strictObject({
  name: z.string().min(2).max(120),
  handle: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes")
    .max(80)
    .optional(),
  email: z.email(),
  phone: z.string().min(7).max(30),
  whatsapp: z.string().max(30).optional(),
  city: z.string().min(2).max(80),
  address: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  instagram_handle: z.string().max(60).optional(),
  owner: z.strictObject({
    name: z.string().min(2).max(120),
    email: z.email(),
  }),
})

type RequestBody = z.infer<typeof PostVendorRegisterSchema>

export async function POST(
  req: AuthenticatedMedusaRequest<RequestBody>,
  res: MedusaResponse
) {
  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "This account is already registered as a vendor"
    )
  }

  const body = req.validatedBody

  const { result } = await onboardVendorWorkflow(req.scope).run({
    input: {
      vendor: {
        name: body.name,
        handle: body.handle,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        city: body.city,
        address: body.address,
        description: body.description,
        instagram_handle: body.instagram_handle,
      },
      owner: body.owner,
      authIdentityId: req.auth_context.auth_identity_id,
    },
  })

  res.status(201).json({ vendor: result.vendor })
}
