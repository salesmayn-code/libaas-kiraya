import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import reserveRentalWorkflow from "../workflows/rental/reserve-rental"

const PARALLEL = 50
const EVENT_DATE = "2027-06-10"

export default async function concurrencyCheck({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: listings } = await query.graph({
    entity: "rental_listing",
    fields: ["id", "product.title", "variants.id", "variants.size_label", "units.id", "units.status"],
    filters: { status: "active" },
  })

  const listing = listings.find((candidate) => {
    const units = (candidate.units ?? []).filter((unit) => unit?.status === "active")
    return units.length === 1 && candidate.variants?.length
  })

  if (!listing) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No single-unit listing available for the concurrency check")
  }

  const variant = listing.variants?.[0]

  if (!variant) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Listing has no variant")
  }

  const attempts = Array.from({ length: PARALLEL }, (_, index) =>
    reserveRentalWorkflow(container).run({
      input: {
        listing_id: listing.id,
        variant_spec_id: variant.id,
        customer_id: `cus_concurrency_${index}`,
        event_date: EVENT_DATE,
        rental_start: "2027-06-09",
        rental_end: "2027-06-11",
      },
    })
  )

  const results = await Promise.allSettled(attempts)
  const successes = results.filter((result) => result.status === "fulfilled")

  console.log(
    `Concurrency check: ${successes.length}/${PARALLEL} succeeded on ${listing.product?.title} (${variant.size_label})`
  )

  if (successes.length !== 1) {
    const failures = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[]
    console.error(failures.slice(0, 3).map((failure) => String(failure.reason)))
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Expected exactly one success, received ${successes.length}`)
  }

  const booking = (successes[0] as PromiseFulfilledResult<{ result: { booking: { id: string } } }>)
    .value.result.booking

  const rentalService = container.resolve("rental")
  await rentalService.updateRentalBookings({
    id: booking.id,
    status: "cancelled",
    cancelled_by: "system",
    cancellation_reason: "concurrency check cleanup",
    cancelled_at: new Date(),
  })

  console.log(`Cleaned up booking ${booking.id}`)
}
