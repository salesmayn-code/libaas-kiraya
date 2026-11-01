import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { capturePaymentWorkflow, refundPaymentWorkflow } from "@medusajs/medusa/core-flows"
import { findOrderPayment } from "../../../lib/order-payment"

type CaptureRentalPaymentInput = {
  order_id: string
}

export const captureRentalPaymentStep = createStep(
  "capture-rental-payment",
  async (input: CaptureRentalPaymentInput, { container, context }) => {
    const paymentId = await findOrderPayment(container, input.order_id)

    if (!paymentId) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "The order has no payment to capture"
      )
    }

    await capturePaymentWorkflow(container).run({
      input: { payment_id: paymentId },
      context,
    })

    return new StepResponse({ payment_id: paymentId }, paymentId)
  },
  async (paymentId, { container, context }) => {
    if (!paymentId) {
      return
    }

    await refundPaymentWorkflow(container).run({
      input: {
        payment_id: paymentId,
        note: "Rental cart confirmation compensated",
        idempotency_key: `rental-cart:${paymentId}:compensation`,
      },
      context,
    })
  }
)
