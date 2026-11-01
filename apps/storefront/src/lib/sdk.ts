import Medusa from "@medusajs/js-sdk"

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  debug: false,
})
