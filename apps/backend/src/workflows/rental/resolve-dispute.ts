import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { resolveDisputeStep } from "./steps/resolve-dispute"
import { settleBookingLedgerEntriesStep } from "./steps/settle-ledger-entries"
import { settleDepositStep } from "./steps/settle-deposit"

export type ResolveDisputeWorkflowInput = {
  dispute_id: string
  admin_id: string
  resolution: "customer" | "vendor" | "split"
  resolved_deduction: number
  admin_notes?: string | null
}

const resolveDisputeWorkflow = createWorkflow(
  "resolve-dispute",
  function (input: ResolveDisputeWorkflowInput) {
    const resolved = resolveDisputeStep(input)

    const note = transform({ input }, ({ input }) => input.admin_notes ?? "Dispute resolved by admin")

    const settled = settleDepositStep({
      booking_id: resolved.booking_id,
      deduction: resolved.deduction,
      actor_type: "admin",
      actor_id: input.admin_id,
      note,
    })

    settleBookingLedgerEntriesStep({
      booking_id: resolved.booking_id,
      deduction: resolved.deduction,
    })

    return new WorkflowResponse({ settlement: settled })
  }
)

export default resolveDisputeWorkflow
