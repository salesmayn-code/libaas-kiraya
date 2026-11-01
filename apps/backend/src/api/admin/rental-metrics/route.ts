import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type QueryClient = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<{ rows: T[] }>
}

type MetricsRow = {
  bookings_today: string
  active_bookings: string
  overdue: string
  open_disputes: string
  gmv: string | null
  take_rate: string | null
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as QueryClient

  const result = await knex.raw<MetricsRow>(
    `select
       (select count(*)::text from rental_booking
         where rental_start::date = (now() at time zone 'Asia/Karachi')::date
           and deleted_at is null) as bookings_today,
       (select count(*)::text from rental_booking
         where status in ('confirmed','with_customer','returned','settling','disputed')
           and deleted_at is null) as active_bookings,
       (select count(*)::text from rental_booking
         where ops_flag = 'overdue' and deleted_at is null) as overdue,
       (select count(*)::text from rental_dispute
         where status in ('open','under_review') and deleted_at is null) as open_disputes,
       (select coalesce(sum(rental_fee), 0)::text from rental_booking
         where status in ('confirmed','with_customer','returned','settling','disputed','completed')
           and deleted_at is null) as gmv,
       (select coalesce(sum(platform_fee), 0)::text from rental_booking
         where status in ('confirmed','with_customer','returned','settling','disputed','completed')
           and deleted_at is null) as take_rate`
  )

  const row = result.rows[0]

  res.json({
    bookings_today: Number(row?.bookings_today ?? 0),
    active_bookings: Number(row?.active_bookings ?? 0),
    overdue: Number(row?.overdue ?? 0),
    open_disputes: Number(row?.open_disputes ?? 0),
    gmv: Number(row?.gmv ?? 0),
    take_rate: Number(row?.take_rate ?? 0),
  })
}
