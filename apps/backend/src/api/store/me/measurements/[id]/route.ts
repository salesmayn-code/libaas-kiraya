import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import saveMeasurementWorkflow from "../../../../../workflows/measurement/save-measurement"
import deleteMeasurementWorkflow from "../../../../../workflows/measurement/delete-measurement"
import { MeasurementBodySchema } from "../route"

type RequestBody = z.infer<typeof MeasurementBodySchema>

export async function POST(req: AuthenticatedMedusaRequest<RequestBody>, res: MedusaResponse) {
  const { result } = await saveMeasurementWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.json({ profile: result.profile })
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await deleteMeasurementWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.status(204).send()
}
