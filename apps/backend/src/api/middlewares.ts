import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { GetRentalSearchSchema } from "./store/rentals/search/route"
import { GetListingAvailabilitySchema } from "./store/rentals/listings/[id]/availability/route"
import { PostRentalQuoteSchema } from "./store/rentals/quote/route"
import { PostCartRentalSchema } from "./store/carts/[id]/rentals/route"
import { PostBookingCancelSchema } from "./store/me/bookings/[id]/cancel/route"
import { PostBookingDisputeSchema } from "./store/me/bookings/[id]/dispute/route"
import { MeasurementBodySchema } from "./store/me/measurements/route"
import { PostBookingReviewSchema } from "./store/me/bookings/[id]/review/route"
import { PostVendorInspectionSchema } from "./vendor/bookings/[id]/inspection/route"
import { PostVendorCancelSchema } from "./vendor/bookings/[id]/cancel/route"
import { PostResolveDisputeSchema } from "./admin/disputes/[id]/resolve/route"
import { PostVendorDispatchSchema } from "./vendor/bookings/[id]/dispatch/route"
import { PostCreatePayoutSchema } from "./admin/payouts/route"
import { PostMarkPayoutPaidSchema } from "./admin/payouts/[id]/mark-paid/route"
import { PostVendorRegisterSchema } from "./vendor/register/route"
import { PostVendorUploadSignSchema } from "./vendor/uploads/sign/route"
import { PostVendorListingSchema } from "./vendor/listings/route"
import { UpdateVendorListingSchema } from "./vendor/listings/[id]/route"
import { rateLimit } from "../lib/rate-limit"
import { PostVendorUnitSchema } from "./vendor/listings/[id]/units/route"
import { PostUpdateUnitSchema } from "./vendor/units/[id]/route"
import { PostApproveVendorSchema } from "./admin/vendors/[id]/approve/route"
import { PostRejectVendorSchema } from "./admin/vendors/[id]/reject/route"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/rentals/search",
      method: "GET",
      middlewares: [
        rateLimit({ windowSeconds: 60, max: 120, keyPrefix: "search" }),
        validateAndTransformQuery(GetRentalSearchSchema, { defaults: [], isList: true }),
      ],
    },
    {
      matcher: "/store/rentals/listings/:id/availability",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetListingAvailabilitySchema, { defaults: [], isList: false }),
      ],
    },
    {
      matcher: "/store/rentals/quote",
      method: "POST",
      middlewares: [
        rateLimit({ windowSeconds: 60, max: 60, keyPrefix: "quote" }),
        validateAndTransformBody(PostRentalQuoteSchema),
      ],
    },
    {
      matcher: "/store/carts/:id/rentals",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        rateLimit({ windowSeconds: 60, max: 20, keyPrefix: "hold" }),
        validateAndTransformBody(PostCartRentalSchema),
      ],
    },
    {
      matcher: "/store/carts/:id/rentals/:booking_id",
      method: "DELETE",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/rental-carts/:id/complete",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/me*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/me/bookings/:id/cancel",
      method: "POST",
      middlewares: [validateAndTransformBody(PostBookingCancelSchema)],
    },
    {
      matcher: "/store/me/bookings/:id/dispute",
      method: "POST",
      middlewares: [validateAndTransformBody(PostBookingDisputeSchema)],
    },
    {
      matcher: "/store/me/measurements",
      method: "POST",
      middlewares: [validateAndTransformBody(MeasurementBodySchema)],
    },
    {
      matcher: "/store/me/measurements/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(MeasurementBodySchema)],
    },
    {
      matcher: "/store/me/bookings/:id/review",
      method: "POST",
      middlewares: [validateAndTransformBody(PostBookingReviewSchema)],
    },
    {
      matcher: "/vendor/bookings/:id/dispatch",
      method: "POST",
      middlewares: [validateAndTransformBody(PostVendorDispatchSchema)],
    },
    {
      matcher: "/vendor/bookings/:id/inspection",
      method: "POST",
      middlewares: [validateAndTransformBody(PostVendorInspectionSchema)],
    },
    {
      matcher: "/vendor/bookings/:id/cancel",
      method: "POST",
      middlewares: [validateAndTransformBody(PostVendorCancelSchema)],
    },
    {
      matcher: "/admin/disputes/:id/resolve",
      method: "POST",
      middlewares: [validateAndTransformBody(PostResolveDisputeSchema)],
    },
    {
      matcher: "/admin/payouts",
      method: "POST",
      middlewares: [validateAndTransformBody(PostCreatePayoutSchema)],
    },
    {
      matcher: "/admin/payouts/:id/mark-paid",
      method: "POST",
      middlewares: [validateAndTransformBody(PostMarkPayoutPaidSchema)],
    },
    {
      matcher: "/vendor/register",
      method: "POST",
      middlewares: [
        authenticate("vendor", ["session", "bearer"], {
          allowUnregistered: true,
        }),
        validateAndTransformBody(PostVendorRegisterSchema),
      ],
    },
    {
      matcher: "/vendor/me*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/listings*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/listings",
      method: "POST",
      middlewares: [validateAndTransformBody(PostVendorListingSchema)],
    },
    {
      matcher: "/vendor/listings/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateVendorListingSchema)],
    },
    {
      matcher: "/vendor/listings/:id/units",
      method: "POST",
      middlewares: [validateAndTransformBody(PostVendorUnitSchema)],
    },
    {
      matcher: "/vendor/units/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostUpdateUnitSchema)],
    },
    {
      matcher: "/vendor/units*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/blocks*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/calendar*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/bookings*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/earnings*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/payouts*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/uploads*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/uploads/sign",
      method: "POST",
      middlewares: [validateAndTransformBody(PostVendorUploadSignSchema)],
    },
    {
      matcher: "/admin/vendors/:id/approve",
      method: "POST",
      middlewares: [validateAndTransformBody(PostApproveVendorSchema)],
    },
    {
      matcher: "/admin/vendors/:id/reject",
      method: "POST",
      middlewares: [validateAndTransformBody(PostRejectVendorSchema)],
    },
  ],
})
