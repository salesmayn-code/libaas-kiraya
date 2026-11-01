import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import RentalModule from "../modules/rental"

export default defineLink(OrderModule.linkable.order, {
  linkable: RentalModule.linkable.rentalBooking,
  isList: true,
})
