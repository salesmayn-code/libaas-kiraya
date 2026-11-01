import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RENTAL_MODULE } from "../../../modules/rental"
import RentalModuleService from "../../../modules/rental/service"

type ConfirmBookingsInput = {
  order_id: string
  cart_id: string
}

type OrderItemForBooking = {
  id: string
  metadata?: Record<string, unknown> | null
}

type PreviousBooking = {
  id: string
  order_id: string
  line_item_id: string | null
  deposit_id: string | null
}

export const confirmBookingsStep = createStep(
  "confirm-bookings",
  async (input: ConfirmBookingsInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const cartService = container.resolve(Modules.CART)
    const rentalService: RentalModuleService = container.resolve("rental")

    const cart = await cartService.retrieveCart(input.cart_id, {
      relations: ["items"],
    })

    const cartLineByBooking = new Map<string, string>()

    for (const item of cart.items ?? []) {
      const bookingId = item.metadata?.booking_id

      if (typeof bookingId === "string") {
        cartLineByBooking.set(bookingId, item.id)
      }
    }

    if (!cartLineByBooking.size) {
      return new StepResponse({ bookings: [], deposits: [] }, [])
    }

    const bookings = await rentalService.listRentalBookings({
      cart_id: input.cart_id,
    })

    if (!bookings.length) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "The cart has rental lines but no bookings"
      )
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "items.id", "items.metadata"],
      filters: { id: input.order_id },
    })

    const order = orders[0]

    if (!order) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
    }

    const orderItemByBooking = new Map<string, string>()

    for (const item of (order.items ?? []) as OrderItemForBooking[]) {
      const bookingId = item.metadata?.booking_id

      if (typeof bookingId === "string") {
        orderItemByBooking.set(bookingId, item.id)
      }
    }

    const now = new Date()
    const previous: PreviousBooking[] = []
    const confirmed: string[] = []

    for (const booking of bookings) {
      if (booking.status === "confirmed" && booking.order_id === input.order_id) {
        confirmed.push(booking.id)
        continue
      }

      if (booking.status !== "held") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "A rental hold in this cart is no longer active. Reserve it again"
        )
      }

      if (new Date(booking.hold_expires_at ?? 0).getTime() < Date.now()) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "A rental hold in this cart has expired. Reserve it again"
        )
      }

      const orderLineId = orderItemByBooking.get(booking.id)

      if (!orderLineId) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "The order is missing a rental line item"
        )
      }

      const existingDeposits = await rentalService.listRentalDeposits({
        booking_id: booking.id,
      })

      let depositId = existingDeposits[0]?.id ?? null

      if (!depositId) {
        const deposit = await rentalService.createRentalDeposits({
          booking_id: booking.id,
          mode: "charge_refund",
          amount: booking.deposit_amount,
          status: "secured",
          captured_amount: 0,
          released_amount: 0,
          secured_at: now,
        })
        depositId = deposit.id
      }

      await rentalService.updateRentalBookings({
        id: booking.id,
        status: "confirmed",
        order_id: input.order_id,
        line_item_id: orderLineId,
      })

      await rentalService.createRentalBookingEvents({
        booking_id: booking.id,
        from_status: "held",
        to_status: "confirmed",
        actor_type: "system",
        meta: {
          order_id: input.order_id,
          deposit_id: depositId,
        },
      })

      await link.create({
        [Modules.ORDER]: { order_id: input.order_id },
        [RENTAL_MODULE]: { rental_booking_id: booking.id },
      })

      previous.push({
        id: booking.id,
        order_id: input.order_id,
        line_item_id: cartLineByBooking.get(booking.id) ?? null,
        deposit_id: existingDeposits.length ? null : depositId,
      })
      confirmed.push(booking.id)
    }

    return new StepResponse({ bookings: confirmed, deposits: previous }, previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const rentalService: RentalModuleService = container.resolve("rental")

    for (const entry of previous) {
      await rentalService.updateRentalBookings({
        id: entry.id,
        status: "held",
        order_id: null,
        line_item_id: entry.line_item_id,
      })

      if (entry.deposit_id) {
        await rentalService.deleteRentalDeposits(entry.deposit_id)
      }

      await link.dismiss({
        [Modules.ORDER]: { order_id: entry.order_id },
        [RENTAL_MODULE]: { rental_booking_id: entry.id },
      })
    }
  }
)
