import { MedusaService } from "@medusajs/framework/utils"
import RentalBlock from "./models/rental-block"
import RentalBooking from "./models/rental-booking"
import RentalBookingEvent from "./models/rental-booking-event"
import RentalDeposit from "./models/rental-deposit"
import RentalDispute from "./models/rental-dispute"
import RentalInspection from "./models/rental-inspection"
import RentalListing from "./models/rental-listing"
import RentalSetting from "./models/rental-setting"
import RentalUnit from "./models/rental-unit"
import RentalVariantSpec from "./models/rental-variant-spec"

class RentalModuleService extends MedusaService({
  RentalSetting,
  RentalListing,
  RentalVariantSpec,
  RentalUnit,
  RentalBooking,
  RentalBookingEvent,
  RentalBlock,
  RentalDeposit,
  RentalInspection,
  RentalDispute,
}) {
  async getSettings() {
    const [settings] = await this.listRentalSettings({}, { take: 1 })

    if (settings) {
      return settings
    }

    return this.createRentalSettings({})
  }
}

export default RentalModuleService
