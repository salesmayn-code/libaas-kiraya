import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { reserveUnitStep, type ReserveUnitInput } from "./steps/reserve-unit"

export type ReserveRentalWorkflowInput = ReserveUnitInput

const reserveRentalWorkflow = createWorkflow(
  "reserve-rental",
  function (input: ReserveRentalWorkflowInput) {
    const booking = reserveUnitStep(input)

    return new WorkflowResponse({ booking })
  }
)

export default reserveRentalWorkflow
