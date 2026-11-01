import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { markPayoutPaidStep } from "./steps/payout-actions"

export type MarkPayoutPaidWorkflowInput = {
  payout_id: string
  admin_id: string
  reference?: string
}

const markPayoutPaidWorkflow = createWorkflow(
  "mark-payout-paid",
  function (input: MarkPayoutPaidWorkflowInput) {
    const payout = markPayoutPaidStep(input)

    return new WorkflowResponse({ payout })
  }
)

export default markPayoutPaidWorkflow
