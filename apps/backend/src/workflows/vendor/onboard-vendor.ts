import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { createVendorStep, type CreateVendorStepInput } from "./steps/create-vendor"
import { createVendorUserStep } from "./steps/create-vendor-user"

export type OnboardVendorWorkflowInput = {
  vendor: CreateVendorStepInput
  owner: {
    name: string
    email: string
  }
  authIdentityId: string
}

const onboardVendorWorkflow = createWorkflow(
  "onboard-vendor",
  function (input: OnboardVendorWorkflowInput) {
    const vendor = createVendorStep(input.vendor)

    const vendorUserInput = transform({ input, vendor }, ({ input, vendor }) => ({
      vendor_id: vendor.id,
      auth_identity_id: input.authIdentityId,
      name: input.owner.name,
      email: input.owner.email,
      role: "owner" as const,
    }))

    const vendorUser = createVendorUserStep(vendorUserInput)

    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: "vendor",
      value: vendorUser.id,
    })

    return new WorkflowResponse({
      vendor,
      vendor_user: vendorUser,
    })
  }
)

export default onboardVendorWorkflow
