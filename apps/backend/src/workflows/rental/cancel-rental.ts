import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { cancelRentalStep, type CancelRentalInput } from "./steps/cancel-rental"
import { reverseBookingLedgerEntriesStep } from "./steps/reverse-ledger-entries"

const cancelRentalWorkflow = createWorkflow(
  "cancel-rental",
  function (input: CancelRentalInput) {
    const result = cancelRentalStep(input)

    reverseBookingLedgerEntriesStep({ booking_id: input.booking_id })

    return new WorkflowResponse(result)
  }
)

export default cancelRentalWorkflow
