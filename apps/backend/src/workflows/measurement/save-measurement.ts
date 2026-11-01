import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { saveMeasurementStep, type SaveMeasurementInput } from "./steps/save-measurement"

const saveMeasurementWorkflow = createWorkflow(
  "save-measurement",
  function (input: SaveMeasurementInput) {
    const profile = saveMeasurementStep(input)

    return new WorkflowResponse({ profile })
  }
)

export default saveMeasurementWorkflow
