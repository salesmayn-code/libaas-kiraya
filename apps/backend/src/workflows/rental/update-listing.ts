import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateListingStep, type UpdateListingInput } from "./steps/update-listing"

const updateListingWorkflow = createWorkflow(
  "update-listing",
  function (input: UpdateListingInput) {
    const listing = updateListingStep(input)

    return new WorkflowResponse({ listing })
  }
)

export default updateListingWorkflow
