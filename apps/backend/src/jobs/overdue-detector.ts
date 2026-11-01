import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const config = {
  name: "overdue-detector",
  schedule: "0 5 * * *",
}

type QueryClient = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<{ rows: T[] }>
}

export default async function overdueDetector(container: MedusaContainer) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as QueryClient
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const overdue = await knex.raw<{ id: string; unit_id: string }>(
    `update rental_booking
     set ops_flag = 'overdue', updated_at = now()
     where status = 'with_customer'
       and rental_end < (now() at time zone 'Asia/Karachi')::date
       and deleted_at is null
       and ops_flag <> 'overdue'
     returning id, unit_id`
  )

  for (const row of overdue.rows) {
    await knex.raw(
      `update rental_booking
       set ops_flag = 'at_risk', updated_at = now()
       where unit_id = ?
         and status = 'confirmed'
         and rental_start >= (now() at time zone 'Asia/Karachi')::date
         and deleted_at is null
         and ops_flag = 'none'`,
      [row.unit_id]
    )
  }

  if (overdue.rows.length) {
    logger.info(`[overdue-detector] Flagged ${overdue.rows.length} overdue return(s)`)
  }
}
