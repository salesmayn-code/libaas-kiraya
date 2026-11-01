import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { refundPaymentWorkflow } from "@medusajs/medusa/core-flows"
import { findCapturedPayment } from "../../../lib/order-payment"
import { sendEmail } from "../../../lib/notify"
import RentalModuleService from "../../../modules/rental/service"

type SettleDepositInput = {
  booking_id: string
  deduction: number
  actor_type: "customer" | "vendor" | "admin" | "system"
  actor_id?: string | null
  note?: string
}

export const settleDepositStep = createStep(
  "settle-deposit",
  async (input: SettleDepositInput, { container, context }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.status !== "settling" && booking.status !== "disputed") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This booking is not waiting for a deposit decision"
      )
    }

    const [deposit] = await rentalService.listRentalDeposits({
      booking_id: booking.id,
    })

    if (!deposit) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Booking has no deposit record")
    }

    const depositAmount = Number(deposit.amount)
    const deduction = Math.min(Math.max(0, input.deduction), depositAmount)
    const released = Math.max(0, depositAmount - deduction)
    const paymentId = booking.order_id
      ? await findCapturedPayment(container, booking.order_id)
      : null

    const previous = {
      booking_status: booking.status,
      deposit_status: deposit.status,
      captured_amount: Number(deposit.captured_amount),
      released_amount: Number(deposit.released_amount),
      settled_at: deposit.settled_at,
    }

    if (released > 0) {
      if (!paymentId) {
        await rentalService.updateRentalBookings({
          id: booking.id,
          ops_flag: "settlement_failed",
        })
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "No captured payment found for the deposit release"
        )
      }

      try {
        await refundPaymentWorkflow(container).run({
          input: {
            payment_id: paymentId,
            amount: released,
            note: input.note ?? `Deposit release for booking ${booking.id}`,
            idempotency_key: `deposit:${booking.id}:release`,
          },
          context,
        })
      } catch (error) {
        await rentalService.updateRentalBookings({
          id: booking.id,
          ops_flag: "settlement_failed",
        })
        throw error
      }
    }

    const now = new Date()

    await rentalService.updateRentalDeposits({
      id: deposit.id,
      status: "settled",
      captured_amount: deduction,
      released_amount: released,
      settled_at: now,
    })

    await rentalService.updateRentalBookings({
      id: booking.id,
      status: "completed",
      completed_at: now,
      ops_flag: "none",
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: booking.status,
      to_status: "completed",
      actor_type: input.actor_type,
      actor_id: input.actor_id ?? null,
      meta: {
        deduction,
        released,
        payment_id: paymentId,
      },
    })

    try {
      const customerService = container.resolve(Modules.CUSTOMER)
      const customer = await customerService.retrieveCustomer(booking.customer_id)
      await sendEmail(container, {
        to: customer.email ?? "",
        template: "rental-completed",
        data: {
          booking_id: booking.id,
          deduction,
          released,
        },
      })
    } catch (error) {
      void error
    }

    return new StepResponse(
      { booking_id: booking.id, deduction, released },
      { booking_id: booking.id, deposit_id: deposit.id, ...previous }
    )
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")

    await rentalService.updateRentalDeposits({
      id: previous.deposit_id,
      status: previous.deposit_status as "secured",
      captured_amount: previous.captured_amount,
      released_amount: previous.released_amount,
      settled_at: previous.settled_at,
    })

    await rentalService.updateRentalBookings({
      id: previous.booking_id,
      status: previous.booking_status as "settling",
      completed_at: null,
      ops_flag: "settlement_failed",
    })
  }
)
