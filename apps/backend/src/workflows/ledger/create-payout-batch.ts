import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createPayoutBatchStep } from "./steps/create-payout-batch"

export type CreatePayoutBatchWorkflowInput = {
  vendor_id: string
  period_start: string
  period_end: string
}

const createPayoutBatchWorkflow = createWorkflow(
  "create-payout-batch",
  function (input: CreatePayoutBatchWorkflowInput) {
    const payout = createPayoutBatchStep(input)

    return new WorkflowResponse({ payout })
  }
)

export default createPayoutBatchWorkflow
