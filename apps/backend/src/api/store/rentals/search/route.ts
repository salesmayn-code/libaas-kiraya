import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { addCalendarDays } from "../../../../lib/pricing"

export const GetRentalSearchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  city: z.string().min(2).max(80).optional(),
  size: z.string().min(1).max(30).optional(),
  occasion: z.string().min(1).max(30).optional(),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type RentalSearchQuery = z.infer<typeof GetRentalSearchSchema>

type QueryResult<T> = { rows: T[] }

type KnexLike = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<QueryResult<T>>
}

type SearchRow = {
  id: string
  available_unit_count: number
  free_dates: string[]
  total: string | number
}

const ACTIVE_BOOKING_STATUSES =
  "('held','confirmed','with_customer','returned','settling','disputed')"

export async function GET(
  req: MedusaRequest<unknown, RentalSearchQuery>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as KnexLike
  const search = req.validatedQuery

  if (search.date < new Date().toISOString().slice(0, 10)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose a date in the future")
  }

  const ribbonEnd = addCalendarDays(search.date, 13)

  const sizeFilter = search.size
    ? `and u.variant_id in (
         select s.variant_id from rental_variant_spec s
         where s.listing_id = l.id and s.size_label = ?
       )`
    : ""

  const availabilityWindow = (startExpression: string, endExpression: string) => `
    not exists (
      select 1 from rental_booking b
      where b.unit_id = u.id
        and b.deleted_at is null
        and b.status in ${ACTIVE_BOOKING_STATUSES}
        and b.blocked_during && daterange(
          (${startExpression})::date,
          (${endExpression})::date,
          '[]'
        )
    )
    and not exists (
      select 1 from rental_block k
      where k.unit_id = u.id
        and k.deleted_at is null
        and k.blocked_during && daterange(
          (${startExpression})::date,
          (${endExpression})::date,
          '[]'
        )
    )
  `

  const selectedWindow = availabilityWindow(
    "?::date - (1 + l.lead_buffer_days)",
    "?::date + (1 + l.return_buffer_days)"
  )

  const ribbonWindow = availabilityWindow(
    "day_value::date - (1 + l.lead_buffer_days)",
    "day_value::date + (1 + l.return_buffer_days)"
  )

  const bindings: unknown[] = []

  if (search.size) bindings.push(search.size)
  bindings.push(search.date, search.date)
  bindings.push(search.date, search.date)
  bindings.push(search.date, ribbonEnd)
  if (search.size) bindings.push(search.size)

  bindings.push(search.city ?? null, search.city ?? null)
  if (search.occasion) bindings.push(search.occasion)
  bindings.push(search.min_price ?? null, search.min_price ?? null)
  bindings.push(search.max_price ?? null, search.max_price ?? null)

  const sql = `
    select q.id, q.available_unit_count, q.free_dates, count(*) over() as total
    from (
      select l.id,
        l.rating_avg,
        l.created_at,
        (
          select count(*)::int
          from rental_unit u
          where u.listing_id = l.id
            and u.status = 'active'
            and u.deleted_at is null
            ${sizeFilter}
            and ${selectedWindow}
        ) as available_unit_count,
        coalesce((
          select array_agg(day_value::date::text order by day_value)
          from generate_series(?::date, ?::date, interval '1 day') as day_value
          where exists (
            select 1
            from rental_unit u
            where u.listing_id = l.id
              and u.status = 'active'
              and u.deleted_at is null
              ${sizeFilter}
              and ${ribbonWindow}
          )
        ), '{}'::text[]) as free_dates
      from rental_listing l
      where l.status = 'active'
        and l.deleted_at is null
        and (?::text is null or l.city = ?::text)
        ${search.occasion ? "and ? = any(l.occasion_tags)" : ""}
        and (?::int is null or l.base_amount >= ?::int)
        and (?::int is null or l.base_amount <= ?::int)
    ) q
    where ?::date::text = any(q.free_dates)
    order by q.rating_avg desc, q.created_at desc
    limit ? offset ?
  `

  bindings.push(search.date, search.limit, search.offset)

  const result = await knex.raw<SearchRow>(sql, bindings)

  const ids = result.rows.map((row) => row.id)
  const total = Number(result.rows[0]?.total ?? 0)

  if (!ids.length) {
    res.json({ listings: [], count: total, offset: search.offset, limit: search.limit })
    return
  }

  const { data: listings } = await query.graph({
    entity: "rental_listing",
    fields: [
      "id",
      "city",
      "base_amount",
      "deposit_amount",
      "base_days",
      "min_days",
      "max_days",
      "fulfillment_modes",
      "cancellation_policy",
      "occasion_tags",
      "rating_avg",
      "rating_count",
      "product.id",
      "product.title",
      "product.handle",
      "product.thumbnail",
      "product.images.url",
      "product.vendor.id",
      "product.vendor.name",
      "product.vendor.handle",
      "variants.id",
      "variants.size_label",
      "variants.measurements",
      "variants.alterable",
    ],
    filters: { id: ids },
  })

  const byId = new Map(result.rows.map((row) => [row.id, row]))

  const ordered = ids
    .map((id) => listings.find((listing) => listing.id === id))
    .filter((listing): listing is (typeof listings)[number] => Boolean(listing))
    .map((listing) => {
      const meta = byId.get(listing.id)
      return {
        ...listing,
        available_unit_count: meta?.available_unit_count ?? 0,
        free_dates: meta?.free_dates ?? [],
      }
    })

  res.json({ listings: ordered, count: total, offset: search.offset, limit: search.limit })
}
