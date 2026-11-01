import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

class WhatsAppStubProviderService extends AbstractNotificationProviderService {
  static identifier = "whatsapp-stub"

  protected logger_: Logger

  constructor({ logger }: InjectedDependencies) {
    super()
    this.logger_ = logger
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const data = (notification.data ?? {}) as Record<string, unknown>
    const message =
      typeof data.message === "string"
        ? data.message
        : `Libaas Kiraya update: ${notification.template}`

    this.logger_.info(
      `[whatsapp-stub] to=${notification.to} template=${notification.template} message="${message}"`
    )

    return { id: `wa_${Date.now()}` }
  }
}

export default WhatsAppStubProviderService
