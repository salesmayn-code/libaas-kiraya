import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type RentalModuleService from "../modules/rental/service"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const rentalService: RentalModuleService = container.resolve("rental")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "email", "display_id", "items.metadata", "shipping_address.phone"],
      filters: { id: data.id },
    })

    const order = orders[0]

    if (!order?.email) {
      return
    }

    const bookingIds = (order.items ?? [])
      .map((item) => item?.metadata?.booking_id)
      .filter((bookingId): bookingId is string => typeof bookingId === "string")

    const bookings = bookingIds.length
      ? await rentalService.listRentalBookings({ id: bookingIds })
      : []

    if (!bookings.length) {
      return
    }

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: "rental-booking-confirmed",
      data: {
        order_id: order.id,
        display_id: order.display_id,
        bookings: bookings.map((booking) => ({
          reference: booking.id,
          rental_start: booking.rental_start,
          rental_end: booking.rental_end,
          event_date: booking.event_date,
          deposit_amount: booking.deposit_amount,
        })),
      },
    })

    await notificationService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: "Rental booking confirmed",
        description: `${bookings.length} rental booking(s) confirmed on order #${order.display_id}.`,
      },
    })

    const phone = order.shipping_address?.phone

    if (phone) {
      await notificationService.createNotifications({
        to: phone,
        channel: "whatsapp",
        template: "rental-booking-confirmed",
        data: {
          message: `Your outfit is booked for ${bookings.length} rental reservation(s). Order #${order.display_id}.`,
        },
      })
    }
  } catch (error) {
    logger.error(`[rental-booking-confirmed] Notification failed: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
