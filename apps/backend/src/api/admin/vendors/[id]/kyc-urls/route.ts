import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createSignedDownload } from "../../../../../lib/storage"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const vendorService = req.scope.resolve("vendor")
  const vendor = await vendorService.retrieveVendor(req.params.id)
  const keys = vendor.kyc_document_keys ?? []

  if (!keys.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No KYC documents uploaded")
  }

  const urls = await Promise.all(
    keys.map(async (key: string) => ({
      key,
      url: await createSignedDownload(key),
    }))
  )

  res.json({ urls })
}
