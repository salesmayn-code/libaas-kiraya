import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type ResolvedVendor = {
  id: string
  name: string
  status: string
  default_cancellation_policy: string
}

export const resolveVendorStep = createStep(
  "resolve-vendor",
  async ({ vendor_user_id }: { vendor_user_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "vendor_user",
      fields: [
        "vendor.id",
        "vendor.name",
        "vendor.status",
        "vendor.default_cancellation_policy",
      ],
      filters: { id: vendor_user_id },
    })

    const vendor = data[0]?.vendor as ResolvedVendor | undefined

    if (!vendor) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
    }

    if (vendor.status !== "active") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Your boutique must be approved before you can manage listings"
      )
    }

    return new StepResponse(vendor)
  }
)
