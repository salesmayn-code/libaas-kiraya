import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addUnitStep, type AddUnitInput } from "./steps/add-unit"

const addUnitWorkflow = createWorkflow(
  "add-unit",
  function (input: AddUnitInput) {
    const unit = addUnitStep(input)

    return new WorkflowResponse({ unit })
  }
)

export default addUnitWorkflow
