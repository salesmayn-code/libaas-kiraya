import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

export const GetListingAvailabilitySchema = z.object({
  variant_spec_id: z.string().min(1),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
})

type Query = z.infer<typeof GetListingAvailabilitySchema>

type QueryResult<T> = { rows: T[] }

type KnexLike = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<QueryResult<T>>
}

type DayRow = { date: string; free: boolean }

export async function GET(
  req: MedusaRequest<unknown, Query>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as KnexLike
  const { variant_spec_id } = req.validatedQuery

  const month = req.validatedQuery.month ?? new Date().toISOString().slice(0, 7)
  const start = `${month}-01`
  const startDate = new Date(`${start}T00:00:00.000Z`)
  const endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0))
  const end = endDate.toISOString().slice(0, 10)

  const { data } = await query.graph({
    entity: "rental_listing",
    fields: [
      "id",
      "status",
      "lead_buffer_days",
      "return_buffer_days",
      "variants.id",
      "variants.size_label",
      "variants.variant_id",
    ],
    filters: { id: req.params.id, status: "active" },
  })

  const listing = data[0]

  if (!listing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Listing not found")
  }

  const spec = listing.variants?.find((variant) => variant?.id === variant_spec_id)

  if (!spec) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "That size does not belong to this listing")
  }

  const result = await knex.raw<DayRow>(
    `select day_value::date::text as date,
       exists (
         select 1
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
               and b.blocked_during && daterange(
                 (day_value::date - (1 + ?))::date,
                 (day_value::date + (1 + ?))::date,
                 '[]'
               )
           )
           and not exists (
             select 1 from rental_block k
             where k.unit_id = u.id
               and k.deleted_at is null
               and k.blocked_during && daterange(
                 (day_value::date - (1 + ?))::date,
                 (day_value::date + (1 + ?))::date,
                 '[]'
               )
           )
       ) as free
     from generate_series(?::date, ?::date, interval '1 day') as day_value
     order by day_value`,
    [
      listing.id,
      spec.variant_id,
      listing.lead_buffer_days,
      listing.return_buffer_days,
      listing.lead_buffer_days,
      listing.return_buffer_days,
      start,
      end,
    ]
  )

  res.json({
    month,
    variant_spec_id,
    days: result.rows.map((row) => ({
      date: row.date,
      status: row.free ? "free" : "taken",
    })),
  })
}
