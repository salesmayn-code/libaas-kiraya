import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { disputeInspectionStep } from "./steps/dispute-inspection"

export type DisputeInspectionWorkflowInput = {
  booking_id: string
  customer_id: string
  reason: string
  evidence_keys?: string[]
}

const disputeInspectionWorkflow = createWorkflow(
  "dispute-inspection",
  function (input: DisputeInspectionWorkflowInput) {
    const dispute = disputeInspectionStep(input)

    return new WorkflowResponse({ dispute })
  }
)

export default disputeInspectionWorkflow
