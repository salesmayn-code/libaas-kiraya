import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { approveInspectionStep } from "./steps/approve-inspection"

type ApproveInspectionWorkflowInput = {
  inspection_id: string
  admin_id: string
}

const approveInspectionWorkflow = createWorkflow(
  "approve-inspection",
  function (input: ApproveInspectionWorkflowInput) {
    const inspection = approveInspectionStep(input)

    return new WorkflowResponse({ inspection })
  }
)

export default approveInspectionWorkflow
