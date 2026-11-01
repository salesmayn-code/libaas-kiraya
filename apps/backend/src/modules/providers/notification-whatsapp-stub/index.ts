import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import WhatsAppStubProviderService from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [WhatsAppStubProviderService],
})
