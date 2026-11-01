import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteMeasurementStep } from "./steps/delete-measurement"

type DeleteMeasurementWorkflowInput = {
  id: string
  customer_id: string
}

const deleteMeasurementWorkflow = createWorkflow(
  "delete-measurement",
  function (input: DeleteMeasurementWorkflowInput) {
    deleteMeasurementStep(input)

    return new WorkflowResponse({ id: input.id })
  }
)

export default deleteMeasurementWorkflow
