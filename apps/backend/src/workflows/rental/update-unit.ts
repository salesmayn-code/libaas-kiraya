import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateUnitStep, type UpdateUnitInput } from "./steps/update-unit"

const updateUnitWorkflow = createWorkflow(
  "update-unit",
  function (input: UpdateUnitInput) {
    const unit = updateUnitStep(input)

    return new WorkflowResponse({ unit })
  }
)

export default updateUnitWorkflow
