import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OrderPaymentQuery = {
  graph: (input: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data: OrderForPayment[] }>
}

type OrderForPayment = {
  id: string
  payment_collections?: {
    payments?: { id: string; captured_at?: string | null; amount?: number }[]
  }[]
}

export async function findOrderPayment(
  container: MedusaContainer,
  orderId: string
): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as OrderPaymentQuery

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "payment_collections.payments.id"],
    filters: { id: orderId },
  })

  const payments = data[0]?.payment_collections?.flatMap(
    (collection) => collection.payments ?? []
  )

  return payments?.[0]?.id ?? null
}

export async function findCapturedPayment(
  container: MedusaContainer,
  orderId: string
): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as OrderPaymentQuery

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "payment_collections.payments.id",
      "payment_collections.payments.captured_at",
      "payment_collections.payments.amount",
    ],
    filters: { id: orderId },
  })

  const payments = data[0]?.payment_collections?.flatMap(
    (collection) => collection.payments ?? []
  )

  const payment = payments?.find((candidate) => candidate.captured_at)

  return payment?.id ?? null
}
