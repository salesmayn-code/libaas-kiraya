import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { publishListingStep } from "./steps/publish-listing"

export type PublishListingWorkflowInput = {
  vendor_user_id: string
  listing_id: string
}

const publishListingWorkflow = createWorkflow(
  "publish-listing",
  function (input: PublishListingWorkflowInput) {
    const listing = publishListingStep(input)

    return new WorkflowResponse({ listing })
  }
)

export default publishListingWorkflow
