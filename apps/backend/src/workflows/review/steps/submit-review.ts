import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type RentalModuleService from "../../../modules/rental/service"
import type ReviewModuleService from "../../../modules/review/service"

export type SubmitReviewInput = {
  booking_id: string
  customer_id: string
  rating: number
  fit?: "small" | "true" | "large" | null
  body?: string | null
  photo_keys?: string[]
}

async function recomputeListingAggregates(
  rentalService: RentalModuleService,
  reviewService: ReviewModuleService,
  listingId: string
) {
  const reviews = await reviewService.listReviews({ listing_id: listingId, status: "published" })

  const count = reviews.length
  const ratingAvg = count
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count
    : 0
  const fitSmall = reviews.filter((review) => review.fit === "small").length
  const fitTrue = reviews.filter((review) => review.fit === "true").length
  const fitLarge = reviews.filter((review) => review.fit === "large").length

  await rentalService.updateRentalListings({
    id: listingId,
    rating_avg: ratingAvg,
    rating_count: count,
    fit_small_count: fitSmall,
    fit_true_count: fitTrue,
    fit_large_count: fitLarge,
  })
}

export const submitReviewStep = createStep(
  "submit-review",
  async (input: SubmitReviewInput, { container }) => {
    const rentalService: RentalModuleService = container.resolve("rental")
    const reviewService: ReviewModuleService = container.resolve("review")

    const booking = await rentalService.retrieveRentalBooking(input.booking_id)

    if (booking.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Booking not found")
    }

    if (booking.status !== "completed") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Reviews open after the deposit is settled"
      )
    }

    const existing = await reviewService.listReviews({ booking_id: booking.id })

    if (existing.length) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "This booking already has a review")
    }

    if (input.rating < 1 || input.rating > 5) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Rating must be between 1 and 5")
    }

    const review = await reviewService.createReviews({
      booking_id: booking.id,
      customer_id: input.customer_id,
      vendor_id: booking.vendor_id,
      listing_id: booking.listing_id,
      rating: input.rating,
      fit: input.fit ?? null,
      body: input.body ?? null,
      photo_keys: input.photo_keys ?? null,
      status: "published",
    })

    await recomputeListingAggregates(rentalService, reviewService, booking.listing_id)

    return new StepResponse(review, {
      review_id: review.id,
      listing_id: booking.listing_id,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const rentalService: RentalModuleService = container.resolve("rental")
    const reviewService: ReviewModuleService = container.resolve("review")

    const review = await reviewService.retrieveReview(previous.review_id)
    await reviewService.deleteReviews(previous.review_id)
    await recomputeListingAggregates(rentalService, reviewService, review.listing_id)
  }
)
