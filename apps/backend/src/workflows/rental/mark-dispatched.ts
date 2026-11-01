import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { markDispatchedStep } from "./steps/vendor-booking-actions"

export type MarkDispatchedWorkflowInput = {
  vendor_user_id: string
  booking_id: string
  photo_keys?: string[]
}

const markDispatchedWorkflow = createWorkflow(
  "mark-dispatched",
  function (input: MarkDispatchedWorkflowInput) {
    const booking = markDispatchedStep(input)

    return new WorkflowResponse({ booking })
  }
)

export default markDispatchedWorkflow
