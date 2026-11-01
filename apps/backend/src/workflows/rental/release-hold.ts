import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { releaseRentalHoldStep, type ReleaseRentalHoldInput } from "./steps/release-hold"

export type ReleaseRentalHoldWorkflowInput = ReleaseRentalHoldInput

const releaseRentalHoldWorkflow = createWorkflow(
  "release-rental-hold",
  function (input: ReleaseRentalHoldWorkflowInput) {
    const result = releaseRentalHoldStep(input)

    return new WorkflowResponse(result)
  }
)

export default releaseRentalHoldWorkflow
