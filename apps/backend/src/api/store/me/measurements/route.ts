import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import saveMeasurementWorkflow from "../../../../workflows/measurement/save-measurement"
import type MeasurementModuleService from "../../../../modules/measurement/service"

export const MeasurementBodySchema = z.strictObject({
  label: z.string().min(1).max(60),
  garment_type: z.enum(["women", "men", "kids"]).default("women"),
  unit: z.enum(["in", "cm"]).default("in"),
  bust_chest: z.number().positive().max(300).optional(),
  waist: z.number().positive().max(300).optional(),
  hips: z.number().positive().max(300).optional(),
  shoulder: z.number().positive().max(300).optional(),
  height: z.number().positive().max(300).optional(),
  is_default: z.boolean().optional(),
  notes: z.string().max(500).optional(),
})

type RequestBody = z.infer<typeof MeasurementBodySchema>

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: MeasurementModuleService = req.scope.resolve("measurement")

  const profiles = await service.listMeasurementProfiles(
    { customer_id: req.auth_context.actor_id },
    { order: { created_at: "DESC" } }
  )

  res.json({ profiles })
}

export async function POST(req: AuthenticatedMedusaRequest<RequestBody>, res: MedusaResponse) {
  const { result } = await saveMeasurementWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.status(201).json({ profile: result.profile })
}
