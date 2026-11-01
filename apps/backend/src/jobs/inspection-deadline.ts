import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import settleDepositWorkflow from "../workflows/rental/settle-deposit"

export const config = {
  name: "inspection-deadline",
  schedule: "0 * * * *",
}

type QueryClient = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<{ rows: T[] }>
}

export default async function inspectionDeadline(container: MedusaContainer) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as QueryClient
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const result = await knex.raw<{ id: string }>(
    `select b.id
     from rental_booking b
     left join rental_inspection i on i.booking_id = b.id and i.deleted_at is null
     where b.status = 'returned'
       and b.deleted_at is null
       and b.inspection_due_at < now()
       and i.id is null`
  )

  for (const row of result.rows) {
    try {
      await settleDepositWorkflow(container).run({
        input: {
          booking_id: row.id,
          deduction: 0,
          actor_type: "system",
          note: "Inspection window lapsed; deposit released in full",
        },
      })
    } catch (error) {
      logger.error(`[inspection-deadline] Failed to settle booking ${row.id}: ${error}`)
    }
  }

  if (result.rows.length) {
    logger.info(`[inspection-deadline] Auto-released ${result.rows.length} deposit(s)`)
  }
}
