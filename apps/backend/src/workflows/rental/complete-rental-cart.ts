import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import confirmRentalWorkflow from "./confirm-rental"
import { captureRentalPaymentStep } from "./steps/capture-payment"
import { validateRentalCartStep } from "./steps/validate-rental-cart"

export type CompleteRentalCartWorkflowInput = {
  cart_id: string
  customer_id: string
}

const completeRentalCartWorkflow = createWorkflow(
  "complete-rental-cart",
  function (input: CompleteRentalCartWorkflowInput) {
    validateRentalCartStep(input)

    const order = completeCartWorkflow.runAsStep({
      input: { id: input.cart_id },
    })

    captureRentalPaymentStep({ order_id: order.id })

    confirmRentalWorkflow.runAsStep({
      input: {
        order_id: order.id,
        cart_id: input.cart_id,
      },
    })

    return new WorkflowResponse({ order_id: order.id })
  }
)

export default completeRentalCartWorkflow
