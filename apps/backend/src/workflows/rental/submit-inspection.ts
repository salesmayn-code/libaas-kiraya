import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { submitInspectionStep, type SubmitInspectionInput } from "./steps/submit-inspection"

const submitInspectionWorkflow = createWorkflow(
  "submit-inspection",
  function (input: SubmitInspectionInput) {
    const inspection = submitInspectionStep(input)

    return new WorkflowResponse({ inspection })
  }
)

export default submitInspectionWorkflow
