import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import VendorModuleService from "../../../modules/vendor/service"

export type CreateVendorUserStepInput = {
  vendor_id: string
  auth_identity_id: string
  name: string
  email: string
  role: "owner" | "staff"
}

export const createVendorUserStep = createStep(
  "create-vendor-user",
  async (input: CreateVendorUserStepInput, { container }) => {
    const vendorService: VendorModuleService = container.resolve("vendor")

    const existing = await vendorService.listVendorUsers({ email: input.email })

    if (existing.length) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "That owner email is already in use")
    }

    const vendorUser = await vendorService.createVendorUsers(input)

    return new StepResponse(vendorUser, vendorUser.id)
  },
  async (vendorUserId, { container }) => {
    if (!vendorUserId) {
      return
    }

    const vendorService: VendorModuleService = container.resolve("vendor")
    await vendorService.deleteVendorUsers(vendorUserId)
  }
)
