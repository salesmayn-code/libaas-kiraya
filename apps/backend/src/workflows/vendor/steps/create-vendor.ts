import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import VendorModuleService from "../../../modules/vendor/service"

export type CreateVendorStepInput = {
  name: string
  handle?: string
  email: string
  phone: string
  whatsapp?: string | null
  city: string
  address?: string | null
  description?: string | null
  instagram_handle?: string | null
  commission_bps?: number
}

function toHandle(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export const createVendorStep = createStep(
  "create-vendor",
  async (input: CreateVendorStepInput, { container }) => {
    const vendorService: VendorModuleService = container.resolve("vendor")

    const handle = input.handle ?? toHandle(input.name)

    if (!handle) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A vendor handle is required")
    }

    const [existingHandle, existingEmail] = await Promise.all([
      vendorService.listVendors({ handle }),
      vendorService.listVendors({ email: input.email }),
    ])

    if (existingHandle.length) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "That vendor handle is taken")
    }

    if (existingEmail.length) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "That vendor email is registered")
    }

    const vendor = await vendorService.createVendors({
      name: input.name,
      handle,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp ?? null,
      city: input.city,
      address: input.address ?? null,
      description: input.description ?? null,
      instagram_handle: input.instagram_handle ?? null,
      commission_bps: input.commission_bps ?? 1200,
      status: "pending",
      kyc_status: "not_submitted",
    })

    return new StepResponse(vendor, vendor.id)
  },
  async (vendorId, { container }) => {
    if (!vendorId) {
      return
    }

    const vendorService: VendorModuleService = container.resolve("vendor")
    await vendorService.deleteVendors(vendorId)
  }
)
