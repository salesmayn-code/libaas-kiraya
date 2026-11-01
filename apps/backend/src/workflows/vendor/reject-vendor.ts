import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { rejectVendorStep } from "./steps/review-vendor"

export type RejectVendorWorkflowInput = {
  vendor_id: string
  reason: string
}

const rejectVendorWorkflow = createWorkflow(
  "reject-vendor",
  function (input: RejectVendorWorkflowInput) {
    const vendor = rejectVendorStep(input)

    return new WorkflowResponse({ vendor })
  }
)

export default rejectVendorWorkflow
