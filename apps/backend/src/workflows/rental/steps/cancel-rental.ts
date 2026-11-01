import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { refundPaymentWorkflow } from "@medusajs/medusa/core-flows"
import {
  cancellationRefund,
  type CancellationPolicy,
} from "../../../lib/pricing"
import { findCapturedPayment } from "../../../lib/order-payment"
import { sendEmail } from "../../../lib/notify"
import RentalModuleService from "../../../modules/rental/service"
import VendorModuleService from "../../../modules/vendor/service"

export type CancelRentalInput = {
  booking_id: string
  actor_type: "customer" | "vendor" | "admin" | "system"
  actor_id?: string | null
  reason?: string
}

type PricingSnapshot = {
  cancellation_policy?: CancellationPolicy
}

export const cancelRentalStep = createStep(
  "cancel-rental",
  async (input: CancelRentalInput, { container, context }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const vendorService: VendorModuleService = container.resolve("vendor")
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (!["held", "confirmed"].includes(booking.status)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This booking can no longer be cancelled online"
      )
    }

    if (input.actor_type === "customer" && input.actor_id && booking.customer_id !== input.actor_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    if (input.actor_type === "vendor" && input.actor_id) {
      const { data } = await query.graph({
        entity: "vendor_user",
        fields: ["vendor.id"],
        filters: { id: input.actor_id },
      })

      if (data[0]?.vendor?.id !== booking.vendor_id) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
      }
    }

    const snapshot = (booking.pricing_snapshot ?? {}) as PricingSnapshot
    const policy = snapshot.cancellation_policy ?? "standard"
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
    const rentalStart = new Date(booking.rental_start).toISOString().slice(0, 10)

    const refund = cancellationRefund({
      policy,
      rental_start: rentalStart,
      cancelled_on: today,
      rental_fee: Number(booking.rental_fee),
      cleaning_fee: Number(booking.cleaning_fee),
      deposit_amount: Number(booking.deposit_amount),
    })

    const paymentId =
      booking.status === "confirmed" && booking.order_id
        ? await findCapturedPayment(container, booking.order_id)
        : null

    const totalRefund =
      booking.status === "confirmed"
        ? refund.fee_refund + refund.cleaning_refund + refund.deposit_release
        : 0

    const previous = {
      id: booking.id,
      status: booking.status,
      cancelled_by: booking.cancelled_by,
      cancellation_reason: booking.cancellation_reason,
      cancelled_at: booking.cancelled_at,
    }

    await rentalService.updateRentalBookings({
      id: booking.id,
      status: "cancelled",
      cancelled_by: input.actor_type,
      cancellation_reason: input.reason ?? null,
      cancelled_at: new Date(),
    })

    if (totalRefund > 0) {
      if (!paymentId) {
        await rentalService.updateRentalBookings({
          id: booking.id,
          ops_flag: "cancel_failed",
        })
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "No captured payment found for the cancellation refund"
        )
      }

      try {
        await refundPaymentWorkflow(container).run({
          input: {
            payment_id: paymentId,
            amount: totalRefund,
            note: input.reason ?? `Cancellation refund for booking ${booking.id}`,
            idempotency_key: `cancel:${booking.id}:refund`,
          },
          context,
        })
      } catch (error) {
        await rentalService.updateRentalBookings({
          id: booking.id,
          ops_flag: "cancel_failed",
        })
        throw error
      }
    }

    const [deposit] = await rentalService.listRentalDeposits({
      booking_id: booking.id,
    })

    if (deposit && deposit.status === "secured") {
      await rentalService.updateRentalDeposits({
        id: deposit.id,
        status: "released",
        released_amount: deposit.amount,
        settled_at: new Date(),
      })
    }

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: booking.status,
      to_status: "cancelled",
      actor_type: input.actor_type,
      actor_id: input.actor_id ?? null,
      meta: {
        refund,
        total_refund: totalRefund,
        payment_id: paymentId,
        reason: input.reason ?? null,
      },
    })

    if (input.actor_type === "vendor") {
      const vendor = await vendorService.retrieveVendor(booking.vendor_id)
      await vendorService.updateVendors({
        id: vendor.id,
        cancellations_90d: vendor.cancellations_90d + 1,
      })
    }

    try {
      const customerService = container.resolve(Modules.CUSTOMER)
      const customer = await customerService.retrieveCustomer(booking.customer_id)
      await sendEmail(container, {
        to: customer.email ?? "",
        template: "rental-cancelled",
        data: {
          booking_id: booking.id,
          total_refund: totalRefund,
          cancelled_by: input.actor_type,
        },
      })
    } catch (error) {
      void error
    }

    return new StepResponse(
      { booking_id: booking.id, refund, total_refund: totalRefund },
      { previous, deposit_id: deposit?.id ?? null }
    )
  },
  async (compensation, { container }) => {
    if (!compensation?.previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")

    await rentalService.updateRentalBookings({
      id: compensation.previous.id,
      status: compensation.previous.status as "held" | "confirmed",
      cancelled_by: compensation.previous.cancelled_by,
      cancellation_reason: compensation.previous.cancellation_reason,
      cancelled_at: compensation.previous.cancelled_at,
      ops_flag: "cancel_failed",
    })

    if (compensation.deposit_id) {
      await rentalService.updateRentalDeposits({
        id: compensation.deposit_id,
        status: "secured",
        released_amount: 0,
        settled_at: null,
      })
    }
  }
)
