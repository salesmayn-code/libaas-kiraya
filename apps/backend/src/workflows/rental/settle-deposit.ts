import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { settleBookingLedgerEntriesStep } from "./steps/settle-ledger-entries"
import { settleDepositStep } from "./steps/settle-deposit"

export type SettleDepositWorkflowInput = {
  booking_id: string
  deduction: number
  actor_type: "customer" | "vendor" | "admin" | "system"
  actor_id?: string | null
  note?: string
}

const settleDepositWorkflow = createWorkflow(
  "settle-deposit",
  function (input: SettleDepositWorkflowInput) {
    const result = settleDepositStep(input)

    settleBookingLedgerEntriesStep({
      booking_id: input.booking_id,
      deduction: result.deduction,
    })

    return new WorkflowResponse(result)
  }
)

export default settleDepositWorkflow
