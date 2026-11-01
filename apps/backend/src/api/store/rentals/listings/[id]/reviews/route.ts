import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type ReviewModuleService from "../../../../../../modules/review/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve("review")

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const [reviews, count] = await reviewService.listAndCountReviews(
    { listing_id: req.params.id, status: "published" },
    { take: limit, skip: offset, order: { created_at: "DESC" } }
  )

  res.json({
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      fit: review.fit,
      body: review.body,
      photo_keys: review.photo_keys,
      created_at: review.created_at,
    })),
    count,
    offset,
    limit,
  })
}
