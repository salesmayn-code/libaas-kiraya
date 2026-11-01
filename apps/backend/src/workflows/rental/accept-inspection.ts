import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acceptInspectionStep } from "./steps/accept-inspection"
import { settleBookingLedgerEntriesStep } from "./steps/settle-ledger-entries"
import { settleDepositStep } from "./steps/settle-deposit"

export type AcceptInspectionWorkflowInput = {
  booking_id: string
  customer_id: string
}

const acceptInspectionWorkflow = createWorkflow(
  "accept-inspection",
  function (input: AcceptInspectionWorkflowInput) {
    const accepted = acceptInspectionStep(input)

    const settled = settleDepositStep({
      booking_id: accepted.inspection.booking_id,
      deduction: accepted.deduction,
      actor_type: "customer",
      actor_id: input.customer_id,
      note: "Customer accepted the inspection",
    })

    settleBookingLedgerEntriesStep({
      booking_id: input.booking_id,
      deduction: accepted.deduction,
    })

    return new WorkflowResponse({ inspection: accepted.inspection, settlement: settled })
  }
)

export default acceptInspectionWorkflow
