import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function sendEmail(
  container: MedusaContainer,
  input: {
    to: string
    template: string
    data: Record<string, unknown>
  }
) {
  if (!input.to) {
    return
  }

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    await notificationService.createNotifications({
      to: input.to,
      channel: "email",
      template: input.template,
      data: input.data,
    })
  } catch (error) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.warn(`[notifications] Could not send ${input.template}: ${error}`)
  }
}
