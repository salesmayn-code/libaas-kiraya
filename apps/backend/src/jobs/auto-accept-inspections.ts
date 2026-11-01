import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import settleDepositWorkflow from "../workflows/rental/settle-deposit"

export const config = {
  name: "auto-accept-inspections",
  schedule: "15 * * * *",
}

type QueryClient = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<{ rows: T[] }>
}

export default async function autoAcceptInspections(container: MedusaContainer) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as QueryClient
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const result = await knex.raw<{ id: string; booking_id: string; total_deduction: string }>(
    `select id, booking_id, total_deduction
     from rental_inspection
     where status = 'submitted'
       and deleted_at is null
       and dispute_deadline < now()`
  )

  for (const row of result.rows) {
    try {
      await knex.raw(
        `update rental_inspection
         set status = 'auto_accepted', decided_at = now(), updated_at = now()
         where id = ?`,
        [row.id]
      )

      await settleDepositWorkflow(container).run({
        input: {
          booking_id: row.booking_id,
          deduction: Number(row.total_deduction),
          actor_type: "system",
          note: "Dispute window lapsed; inspection accepted",
        },
      })
    } catch (error) {
      logger.error(`[auto-accept-inspections] Failed for inspection ${row.id}: ${error}`)
    }
  }

  if (result.rows.length) {
    logger.info(`[auto-accept-inspections] Auto-accepted ${result.rows.length} inspection(s)`)
  }
}
