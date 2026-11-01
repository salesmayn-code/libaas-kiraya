import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { submitReviewStep, type SubmitReviewInput } from "./steps/submit-review"

const submitReviewWorkflow = createWorkflow(
  "submit-review",
  function (input: SubmitReviewInput) {
    const review = submitReviewStep(input)

    return new WorkflowResponse({ review })
  }
)

export default submitReviewWorkflow
