import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { approvePayoutStep } from "./steps/payout-actions"

export type ApprovePayoutWorkflowInput = {
  payout_id: string
  admin_id: string
}

const approvePayoutWorkflow = createWorkflow(
  "approve-payout",
  function (input: ApprovePayoutWorkflowInput) {
    const payout = approvePayoutStep(input)

    return new WorkflowResponse({ payout })
  }
)

export default approvePayoutWorkflow
