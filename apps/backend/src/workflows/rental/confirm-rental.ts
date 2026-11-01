import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { confirmBookingsStep } from "./steps/confirm-bookings"
import { createBookingLedgerEntriesStep } from "./steps/create-ledger-entries"

export type ConfirmRentalWorkflowInput = {
  order_id: string
  cart_id: string
}

const confirmRentalWorkflow = createWorkflow(
  "confirm-rental",
  function (input: ConfirmRentalWorkflowInput) {
    const result = confirmBookingsStep(input)

    createBookingLedgerEntriesStep({ booking_ids: result.bookings })

    return new WorkflowResponse(result)
  }
)

export default confirmRentalWorkflow
