import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { markReturnedStep } from "./steps/vendor-booking-actions"

export type MarkReturnedWorkflowInput = {
  vendor_user_id: string
  booking_id: string
}

const markReturnedWorkflow = createWorkflow(
  "mark-returned",
  function (input: MarkReturnedWorkflowInput) {
    const booking = markReturnedStep(input)

    return new WorkflowResponse({ booking })
  }
)

export default markReturnedWorkflow
