import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { approveVendorStep } from "./steps/review-vendor"

export type ApproveVendorWorkflowInput = {
  vendor_id: string
  commission_bps?: number
}

const approveVendorWorkflow = createWorkflow(
  "approve-vendor",
  function (input: ApproveVendorWorkflowInput) {
    const vendor = approveVendorStep(input)

    return new WorkflowResponse({ vendor })
  }
)

export default approveVendorWorkflow
