import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import VendorModuleService from "../../../modules/vendor/service"

type ReviewVendorInput = {
  vendor_id: string
  commission_bps?: number
}

type RejectVendorInput = {
  vendor_id: string
  reason: string
}

export const approveVendorStep = createStep(
  "approve-vendor",
  async ({ vendor_id, commission_bps }: ReviewVendorInput, { container }) => {
    const vendorService: VendorModuleService = container.resolve("vendor")
    const vendor = await vendorService.retrieveVendor(vendor_id)

    if (vendor.status === "active") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This vendor is already active")
    }

    if (vendor.status === "rejected") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "A rejected vendor must register again before approval"
      )
    }

    const previous = {
      id: vendor.id,
      status: vendor.status,
      kyc_status: vendor.kyc_status,
      commission_bps: vendor.commission_bps,
    }

    const updated = await vendorService.updateVendors({
      id: vendor_id,
      status: "active",
      kyc_status: "verified",
      commission_bps: commission_bps ?? vendor.commission_bps,
    })

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const vendorService: VendorModuleService = container.resolve("vendor")
    await vendorService.updateVendors({
      id: previous.id,
      status: previous.status,
      kyc_status: previous.kyc_status,
      commission_bps: previous.commission_bps,
    })
  }
)

export const rejectVendorStep = createStep(
  "reject-vendor",
  async ({ vendor_id, reason }: RejectVendorInput, { container }) => {
    const vendorService: VendorModuleService = container.resolve("vendor")
    const vendor = await vendorService.retrieveVendor(vendor_id)

    if (vendor.status === "active") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Suspend an active vendor instead of rejecting them"
      )
    }

    const previous = {
      id: vendor.id,
      status: vendor.status,
      kyc_status: vendor.kyc_status,
      metadata: vendor.metadata,
    }

    const updated = await vendorService.updateVendors({
      id: vendor_id,
      status: "rejected",
      metadata: {
        ...(vendor.metadata ?? {}),
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      },
    })

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const vendorService: VendorModuleService = container.resolve("vendor")
    await vendorService.updateVendors({
      id: previous.id,
      status: previous.status,
      kyc_status: previous.kyc_status,
      metadata: previous.metadata,
    })
  }
)
