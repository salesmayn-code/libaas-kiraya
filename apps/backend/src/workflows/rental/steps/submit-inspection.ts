import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { deductionTotal, diffCalendarDays, lateFee } from "../../../lib/pricing"
import { sendEmail } from "../../../lib/notify"
import RentalModuleService from "../../../modules/rental/service"

export type SubmitInspectionInput = {
  vendor_user_id: string
  booking_id: string
  outcome: "clean" | "minor_damage" | "major_damage" | "loss"
  damage_deduction: number
  notes?: string | null
  photo_keys: string[]
}

type Snapshot = {
  late_fee_amount?: number
}

export const submitInspectionStep = createStep(
  "submit-inspection",
  async (input: SubmitInspectionInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const rentalService: RentalModuleService = container.resolve("rental")

    const { data: vendorUsers } = await query.graph({
      entity: "vendor_user",
      fields: ["vendor.id"],
      filters: { id: input.vendor_user_id },
    })

    const vendorId = vendorUsers[0]?.vendor?.id

    if (!vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor account not found")
    }

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.vendor_id !== vendorId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    if (booking.status !== "returned") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only a returned booking can be inspected"
      )
    }

    const now = new Date()

    if (booking.inspection_due_at && new Date(booking.inspection_due_at).getTime() < now.getTime()) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The inspection window has closed and the deposit has been released"
      )
    }

    const existing = await rentalService.listRentalInspections({ booking_id: booking.id })

    if (existing.length) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "An inspection already exists")
    }

    if (
      (input.outcome === "major_damage" || input.outcome === "loss") &&
      input.photo_keys.length < 3
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Major damage and loss need at least 3 photos"
      )
    }

    if (!Number.isFinite(input.damage_deduction) || input.damage_deduction < 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Deduction cannot be negative")
    }

    const snapshot = (booking.pricing_snapshot ?? {}) as Snapshot
    const returnedOn = new Date(booking.returned_at ?? now).toISOString().slice(0, 10)
    const rentalEnd = new Date(booking.rental_end).toISOString().slice(0, 10)
    const lateDays = Math.max(0, diffCalendarDays(returnedOn, rentalEnd))
    const fee = lateFee({ late_fee_amount: snapshot.late_fee_amount ?? 0 }, lateDays)
    const deposit = Number(booking.deposit_amount)
    const total = deductionTotal({
      damage: input.damage_deduction,
      late_fee: fee,
      deposit_amount: deposit,
    })

    const settings = await rentalService.getSettings()
    const needsReview = total > (deposit * settings.admin_review_deduction_pct) / 100

    const inspection = await rentalService.createRentalInspections({
      booking_id: booking.id,
      filed_by: input.vendor_user_id,
      outcome: input.outcome,
      damage_deduction: input.damage_deduction,
      late_days: lateDays,
      late_fee: fee,
      total_deduction: total,
      notes: input.notes ?? null,
      photo_keys: input.photo_keys,
      status: needsReview ? "needs_admin_review" : "submitted",
      submitted_at: now,
      dispute_deadline: new Date(
        now.getTime() + settings.dispute_window_hours * 60 * 60 * 1000
      ),
    })

    await rentalService.updateRentalBookings({
      id: booking.id,
      status: "settling",
      ops_flag: "none",
    })

    await rentalService.createRentalBookingEvents({
      booking_id: booking.id,
      from_status: "returned",
      to_status: "settling",
      actor_type: "vendor",
      actor_id: input.vendor_user_id,
      meta: {
        inspection_id: inspection.id,
        total_deduction: total,
        needs_admin_review: needsReview,
      },
    })

    try {
      const customerService = container.resolve(Modules.CUSTOMER)
      const customer = await customerService.retrieveCustomer(booking.customer_id)
      await sendEmail(container, {
        to: customer.email ?? "",
        template: "rental-inspection-submitted",
        data: {
          booking_id: booking.id,
          outcome: input.outcome,
          deduction: total,
          deadline: new Date(inspection.dispute_deadline).toISOString(),
          needs_admin_review: needsReview,
        },
      })
    } catch (error) {
      void error
    }

    return new StepResponse(inspection, { inspection_id: inspection.id, booking_id: booking.id })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")

    await rentalService.deleteRentalInspections(previous.inspection_id)
    await rentalService.updateRentalBookings({
      id: previous.booking_id,
      status: "returned",
    })
  }
)
