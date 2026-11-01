import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { addCalendarDays, quote, type PricingRules } from "../../../../lib/pricing"

export const PostRentalQuoteSchema = z.strictObject({
  listing_id: z.string().min(1),
  variant_spec_id: z.string().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rental_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rental_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

type Body = z.infer<typeof PostRentalQuoteSchema>

type QueryResult<T> = { rows: T[] }

type KnexLike = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<QueryResult<T>>
}

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as KnexLike
  const body = req.validatedBody

  const rentalStart = body.rental_start ?? addCalendarDays(body.event_date, -1)
  const rentalEnd = body.rental_end ?? addCalendarDays(body.event_date, 1)

  const { data } = await query.graph({
    entity: "rental_listing",
    fields: [
      "id",
      "status",
      "base_amount",
      "base_days",
      "extra_day_amount",
      "cleaning_fee_amount",
      "deposit_amount",
      "late_fee_amount",
      "min_days",
      "max_days",
      "lead_buffer_days",
      "return_buffer_days",
      "product.vendor.id",
      "variants.id",
      "variants.variant_id",
    ],
    filters: { id: body.listing_id, status: "active" },
  })

  const listing = data[0]

  if (!listing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing not found")
  }

  const spec = listing.variants?.find((variant) => variant?.id === body.variant_spec_id)

  if (!spec) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "That size does not belong to this listing")
  }

  if (!listing.product?.vendor) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing vendor not found")
  }

  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: ["id", "status", "commission_bps"],
    filters: { id: listing.product.vendor.id },
  })

  const vendor = vendors[0]

  if (!vendor || vendor.status !== "active") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This boutique is not accepting bookings")
  }

  const rules: PricingRules = {
    base_amount: Number(listing.base_amount),
    base_days: listing.base_days,
    extra_day_amount: Number(listing.extra_day_amount),
    cleaning_fee_amount: Number(listing.cleaning_fee_amount),
    deposit_amount: Number(listing.deposit_amount),
    late_fee_amount: Number(listing.late_fee_amount),
    min_days: listing.min_days,
    max_days: listing.max_days,
    lead_buffer_days: listing.lead_buffer_days,
    return_buffer_days: listing.return_buffer_days,
    commission_bps: vendor.commission_bps,
  }

  const priced = quote(rules, { rental_start: rentalStart, rental_end: rentalEnd })

  if (body.event_date < rentalStart || body.event_date > rentalEnd) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "The event date must fall inside the rental window"
    )
  }

  const availability = await knex.raw<{ count: string }>(
    `select count(*)::text as count
     from rental_unit u
     where u.listing_id = ?
       and u.variant_id = ?
       and u.status = 'active'
       and u.deleted_at is null
       and not exists (
         select 1 from rental_booking b
         where b.unit_id = u.id
           and b.deleted_at is null
           and b.status in ('held','confirmed','with_customer','returned','settling','disputed')
           and b.blocked_during && daterange(?::date, ?::date, '[]')
       )
       and not exists (
         select 1 from rental_block k
         where k.unit_id = u.id
           and k.deleted_at is null
           and k.blocked_during && daterange(?::date, ?::date, '[]')
       )`,
    [
      listing.id,
      spec.variant_id,
      priced.blocked_start,
      priced.blocked_end,
      priced.blocked_start,
      priced.blocked_end,
    ]
  )

  const availableUnits = Number(availability.rows[0]?.count ?? 0)

  res.json({
    quote: priced,
    available: availableUnits > 0,
    available_units: availableUnits,
    variant_spec_id: spec.id,
    variant_id: spec.variant_id,
  })
}
