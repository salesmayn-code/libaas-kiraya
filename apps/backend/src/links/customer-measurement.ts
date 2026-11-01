import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import MeasurementModule from "../modules/measurement"

export default defineLink(CustomerModule.linkable.customer, {
  linkable: MeasurementModule.linkable.measurementProfile,
  isList: true,
})
