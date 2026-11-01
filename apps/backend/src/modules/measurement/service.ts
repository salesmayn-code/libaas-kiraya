import { MedusaService } from "@medusajs/framework/utils"
import MeasurementProfile from "./models/measurement-profile"

class MeasurementModuleService extends MedusaService({
  MeasurementProfile,
}) {}

export default MeasurementModuleService
