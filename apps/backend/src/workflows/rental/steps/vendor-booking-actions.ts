import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RentalModuleService from "../../../modules/rental/service"
import { addCalendarDays } from "../../../lib/pricing"

type VendorBookingActionInput = {
  vendor_user_id: string
  booking_id: string
  photo_keys?: string[]
}

async function resolveVendorId(input: VendorBookingActionInput, container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "vendor_user",
    fields: ["vendor.id"],
    filters: { id: input.vendor_user_id },
  })

  return data[0]?.vendor?.id as string | undefined
}

export const markDispatchedStep = createStep(
  "mark-dispatched",
  async (input: VendorBookingActionInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const vendorId = await resolveVendorId(input, container)

    if (!vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
    }

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.vendor_id !== vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    if (booking.status !== "confirmed") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only a confirmed booking can be handed over"
      )
    }

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
    const earliest = addCalendarDays(new Date(booking.rental_start).toISOString().slice(0, 10), -1)

    if (today < earliest) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You can mark this as handed over from the day before the rental starts"
      )
    }

    const previous = { status: booking.status }

    const updated = await rentalService.updateRentalBookings({
      id: booking.id,
      status: "with_customer",
      dispatched_at: new Date(),
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: "confirmed",
      to_status: "with_customer",
      actor_type: "vendor",
      actor_id: input.vendor_user_id,
      meta: { handover_photo_keys: input.photo_keys ?? [] },
    })

    return new StepResponse(updated, { id: booking.id, ...previous })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalBookings({
      id: previous.id,
      status: previous.status as "confirmed",
      dispatched_at: null,
    })
  }
)

export const markReturnedStep = createStep(
  "mark-returned",
  async (input: VendorBookingActionInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const vendorId = await resolveVendorId(input, container)

    if (!vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
    }

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.vendor_id !== vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    if (booking.status !== "with_customer") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only a booking that is with the customer can be returned"
      )
    }

    const rentalServiceSettings = await rentalService.getSettings()
    const now = new Date()
    const inspectionDue = new Date(
      now.getTime() + rentalServiceSettings.inspection_window_hours * 60 * 60 * 1000
    )

    const previous = { status: booking.status, returned_at: booking.returned_at }

    const updated = await rentalService.updateRentalBookings({
      id: booking.id,
      status: "returned",
      returned_at: now,
      inspection_due_at: inspectionDue,
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: "with_customer",
      to_status: "returned",
      actor_type: "vendor",
      actor_id: input.vendor_user_id,
      meta: { inspection_due_at: inspectionDue.toISOString() },
    })

    return new StepResponse(updated, { id: booking.id, ...previous })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    await rentalService.updateRentalBookings({
      id: previous.id,
      status: previous.status as "with_customer",
      returned_at: previous.returned_at,
      inspection_due_at: null,
    })
  }
)
