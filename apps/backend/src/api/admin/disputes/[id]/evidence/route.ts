import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createSignedDownload } from "../../../../../lib/storage"

type EvidenceFile = { key: string; url: string }

async function signKeys(keys: (string | null | undefined)[] | null | undefined): Promise<EvidenceFile[]> {
  const validKeys = (keys ?? []).filter((key): key is string => typeof key === "string")

  if (!validKeys.length) {
    return []
  }

  return Promise.all(
    validKeys.map(async (key) => ({
      key,
      url: await createSignedDownload(key),
    }))
  )
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: disputes } = await query.graph({
    entity: "rental_dispute",
    fields: [
      "id",
      "evidence_keys",
      "inspection.id",
      "inspection.photo_keys",
      "inspection.booking.id",
    ],
    filters: { id: req.params.id },
  })

  const dispute = disputes[0]

  if (!dispute) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Dispute not found")
  }

  const bookingId = dispute.inspection?.booking?.id

  const { data: events } = await query.graph({
    entity: "rental_booking_event",
    fields: ["to_status", "meta"],
    filters: { booking_id: bookingId },
  })

  const handoverEvent = (events ?? []).find(
    (event) => event.to_status === "with_customer"
  )
  const handoverKeys =
    (handoverEvent?.meta as { handover_photo_keys?: string[] } | null)
      ?.handover_photo_keys ?? []

  const [handover, inspection, customer] = await Promise.all([
    signKeys(handoverKeys),
    signKeys(dispute.inspection?.photo_keys),
    signKeys(dispute.evidence_keys),
  ])

  res.json({ handover, inspection, customer })
}
