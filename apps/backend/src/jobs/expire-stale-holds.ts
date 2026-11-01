import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const config = {
  name: "expire-stale-holds",
  schedule: "* * * * *",
}

type QueryClient = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<{ rows: T[] }>
}

export default async function expireStaleHolds(container: MedusaContainer) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as QueryClient
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const result = await knex.raw<{ id: string }>(
    `update rental_booking
     set status = 'expired', updated_at = now()
     where status = 'held'
       and hold_expires_at < now()
       and deleted_at is null
     returning id`
  )

  if (result.rows.length) {
    logger.info(`[expire-stale-holds] Released ${result.rows.length} expired hold(s)`)
  }
}
