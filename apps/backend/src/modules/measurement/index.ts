import { Module } from "@medusajs/framework/utils"
import MeasurementModuleService from "./service"

export const MEASUREMENT_MODULE = "measurement"

export default Module(MEASUREMENT_MODULE, {
  service: MeasurementModuleService,
})
