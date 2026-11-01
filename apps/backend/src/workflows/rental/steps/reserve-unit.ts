import {
  ContainerRegistrationKeys,
  generateEntityId,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { quote, type PricingRules } from "../../../lib/pricing"
import type RentalModuleService from "../../../modules/rental/service"
import type VendorModuleService from "../../../modules/vendor/service"

type QueryResult<T> = { rows: T[] }

type QueryClient = {
  raw<T = unknown>(sql: string, bindings?: unknown[]): Promise<QueryResult<T>>
}

type KnexLike = QueryClient & {
  transaction<T>(callback: (trx: QueryClient) => Promise<T>): Promise<T>
}

type UnitCandidate = {
  id: string
}

type BookingRow = {
  id: string
  listing_id: string
  unit_id: string
  variant_id: string
  vendor_id: string
  customer_id: string
  event_date: string | Date
  rental_start: string | Date
  rental_end: string | Date
  blocked_start: string | Date
  blocked_end: string | Date
  days: number
  status: string
  hold_expires_at: string | Date
  rental_fee: string | number
  cleaning_fee: string | number
  deposit_amount: string | number
  platform_fee: string | number
  currency_code: string
}

export type ReserveUnitInput = {
  listing_id: string
  variant_spec_id: string
  customer_id: string
  cart_id?: string | null
  event_date: string
  rental_start: string
  rental_end: string
  fulfillment_mode?: "pickup" | "courier"
  delivery_address?: Record<string, unknown> | null
}

export type ReservedBooking = {
  id: string
  listing_id: string
  unit_id: string
  variant_id: string
  vendor_id: string
  customer_id: string
  cart_id: string | null
  event_date: string
  rental_start: string
  rental_end: string
  blocked_start: string
  blocked_end: string
  days: number
  status: string
  hold_expires_at: string
  rental_fee: number
  cleaning_fee: number
  deposit_amount: number
  platform_fee: number
  currency_code: string
  total_today: number
}

function toIsoDate(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function toTimestamp(value: string) {
  return `${value}T00:00:00.000Z`
}

function isOverlapError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const candidate = error as { code?: string; message?: string }

  return candidate.code === "23P01" || Boolean(candidate.message?.includes("no_overlap"))
}

function todayInPakistan() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export const reserveUnitStep = createStep(
  "reserve-unit",
  async (input: ReserveUnitInput, { container }) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as KnexLike
    const rentalService: RentalModuleService = container.resolve("rental")
    const vendorService: VendorModuleService = container.resolve("vendor")

    const listing = await rentalService.retrieveRentalListing(input.listing_id)

    if (listing.status !== "active") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This listing is not open for booking")
    }

    const vendor = await vendorService.retrieveVendor(listing.vendor_id)

    if (vendor.status !== "active") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This boutique is not accepting bookings")
    }

    const spec = await rentalService.retrieveRentalVariantSpec(input.variant_spec_id)

    if (spec.listing_id !== listing.id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "That size does not belong to this listing")
    }

    const fulfillmentMode = input.fulfillment_mode ?? "pickup"

    if (!listing.fulfillment_modes.includes(fulfillmentMode)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This listing does not offer that fulfillment mode"
      )
    }

    const rules: PricingRules = {
      base_amount: Number(listing.base_amount),
      base_days: listing.base_days,
      extra_day_amount: Number(listing.extra_day_amount),
      cleaning_fee_amount: Number(listing.cleaning_fee_amount),
      deposit_amount: Number(listing.deposit_amount),
      late_fee_amount: Number(listing.late_fee_amount),
      min_days: listing.min_days,
      max_days: listing.max_days,
      lead_buffer_days: listing.lead_buffer_days,
      return_buffer_days: listing.return_buffer_days,
      commission_bps: vendor.commission_bps,
    }

    const priced = quote(rules, {
      rental_start: input.rental_start,
      rental_end: input.rental_end,
    })

    if (input.event_date < input.rental_start || input.event_date > input.rental_end) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The event date must fall inside the rental window"
      )
    }

    if (priced.blocked_start < todayInPakistan()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "That window has already started. Choose a later date"
      )
    }

    const settings = await rentalService.getSettings()

    await knex.raw(
      `update rental_booking
       set status = 'expired', updated_at = now()
       where status = 'held' and hold_expires_at < now() and deleted_at is null`
    )

    const candidates = await knex.raw<UnitCandidate>(
      `select u.id
       from rental_unit u
       where u.listing_id = ?
         and u.variant_id = ?
         and u.status = 'active'
         and u.deleted_at is null
         and not exists (
           select 1 from rental_booking b
           where b.unit_id = u.id
             and b.deleted_at is null
             and b.status in ('held','confirmed','with_customer','returned','settling','disputed')
             and b.blocked_during && daterange(?::date, ?::date, '[]')
         )
         and not exists (
           select 1 from rental_block k
           where k.unit_id = u.id
             and k.deleted_at is null
             and k.blocked_during && daterange(?::date, ?::date, '[]')
         )
       order by u.last_booked_at asc nulls first, u.created_at asc`,
      [
        listing.id,
        spec.variant_id,
        priced.blocked_start,
        priced.blocked_end,
        priced.blocked_start,
        priced.blocked_end,
      ]
    )

    if (!candidates.rows.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "That size is booked for those dates. Try nearby dates or another size"
      )
    }

    const holdExpiresAt = new Date(Date.now() + settings.hold_ttl_minutes * 60_000)
    const bookingId = generateEntityId(undefined, "rbk")

    for (const candidate of candidates.rows) {
      try {
        const booking = await knex.transaction(async (trx) => {
          await trx.raw(`select id from rental_unit where id = ? for update`, [candidate.id])

          await trx.raw(
            `select pg_advisory_xact_lock(hashtext(?))`,
            [`rental-holds:${input.customer_id}`]
          )

          const activeHolds = await trx.raw<{ count: string }>(
            `select count(*)::text as count
             from rental_booking
             where customer_id = ?
               and status = 'held'
               and hold_expires_at > now()
               and deleted_at is null`,
            [input.customer_id]
          )

          if (Number(activeHolds.rows[0]?.count ?? 0) >= settings.max_active_holds) {
            throw new MedusaError(
              MedusaError.Types.NOT_ALLOWED,
              `You can hold ${settings.max_active_holds} outfits at once. Release one to reserve another`
            )
          }

          const blockingBooking = await trx.raw(
            `select 1 from rental_booking
             where unit_id = ?
               and deleted_at is null
               and status in ('held','confirmed','with_customer','returned','settling','disputed')
               and blocked_during && daterange(?::date, ?::date, '[]')
             limit 1`,
            [candidate.id, priced.blocked_start, priced.blocked_end]
          )

          if (blockingBooking.rows.length) {
            return null
          }

          const blockingBlock = await trx.raw(
            `select 1 from rental_block
             where unit_id = ?
               and deleted_at is null
               and blocked_during && daterange(?::date, ?::date, '[]')
             limit 1`,
            [candidate.id, priced.blocked_start, priced.blocked_end]
          )

          if (blockingBlock.rows.length) {
            return null
          }

          const pricingSnapshot = {
            base_amount: rules.base_amount,
            base_days: rules.base_days,
            extra_day_amount: rules.extra_day_amount,
            cleaning_fee_amount: rules.cleaning_fee_amount,
            deposit_amount: rules.deposit_amount,
            late_fee_amount: rules.late_fee_amount,
            commission_bps: rules.commission_bps,
            cancellation_policy: listing.cancellation_policy,
            lead_buffer_days: rules.lead_buffer_days,
            return_buffer_days: rules.return_buffer_days,
          }

          const rawAmount = (amount: number) =>
            JSON.stringify({ value: String(amount), precision: 20 })

          const inserted = await trx.raw<BookingRow>(
            `insert into rental_booking (
               id, listing_id, unit_id, variant_id, vendor_id, customer_id, cart_id,
               event_date, rental_start, rental_end, blocked_start, blocked_end, days,
               status, ops_flag, hold_expires_at, fulfillment_mode, delivery_address,
               currency_code, rental_fee, cleaning_fee, deposit_amount, platform_fee,
               pricing_snapshot, raw_rental_fee, raw_cleaning_fee, raw_deposit_amount,
               raw_platform_fee, created_at, updated_at
             ) values (
               ?, ?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?, ?,
               'held', 'none', ?, ?, ?,
               'pkr', ?, ?, ?, ?,
               ?, ?, ?, ?, ?, now(), now()
             )
             returning *`,
            [
              bookingId,
              listing.id,
              candidate.id,
              spec.variant_id,
              listing.vendor_id,
              input.customer_id,
              input.cart_id ?? null,
              toTimestamp(input.event_date),
              toTimestamp(input.rental_start),
              toTimestamp(input.rental_end),
              toTimestamp(priced.blocked_start),
              toTimestamp(priced.blocked_end),
              priced.days,
              holdExpiresAt.toISOString(),
              fulfillmentMode,
              input.delivery_address ? JSON.stringify(input.delivery_address) : null,
              priced.rental_fee,
              priced.cleaning_fee,
              priced.deposit_amount,
              priced.platform_fee,
              JSON.stringify(pricingSnapshot),
              rawAmount(priced.rental_fee),
              rawAmount(priced.cleaning_fee),
              rawAmount(priced.deposit_amount),
              rawAmount(priced.platform_fee),
            ]
          )

          await trx.raw(`update rental_unit set last_booked_at = now(), updated_at = now() where id = ?`, [
            candidate.id,
          ])

          await trx.raw(
            `insert into rental_booking_event (id, booking_id, from_status, to_status, actor_type, actor_id, meta, created_at, updated_at)
             values (?, ?, null, 'held', 'customer', ?, ?, now(), now())`,
            [
              generateEntityId(undefined, "rbe"),
              bookingId,
              input.customer_id,
              JSON.stringify({ unit_id: candidate.id, quote: priced }),
            ]
          )

          return inserted.rows[0]
        })

        if (!booking) {
          continue
        }

        return new StepResponse<ReservedBooking>({
          id: booking.id,
          listing_id: booking.listing_id,
          unit_id: booking.unit_id,
          variant_id: booking.variant_id,
          vendor_id: booking.vendor_id,
          customer_id: booking.customer_id,
          cart_id: input.cart_id ?? null,
          event_date: toIsoDate(booking.event_date),
          rental_start: toIsoDate(booking.rental_start),
          rental_end: toIsoDate(booking.rental_end),
          blocked_start: toIsoDate(booking.blocked_start),
          blocked_end: toIsoDate(booking.blocked_end),
          days: Number(booking.days),
          status: booking.status,
          hold_expires_at: new Date(booking.hold_expires_at).toISOString(),
          rental_fee: Number(booking.rental_fee),
          cleaning_fee: Number(booking.cleaning_fee),
          deposit_amount: Number(booking.deposit_amount),
          platform_fee: Number(booking.platform_fee),
          currency_code: booking.currency_code,
          total_today:
            Number(priced.rental_fee) + Number(priced.cleaning_fee) + Number(priced.deposit_amount),
        })
      } catch (error) {
        if (isOverlapError(error)) {
          continue
        }

        throw error
      }
    }

    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "That size was just booked. Try another size or date"
    )
  },
  async (booking, { container }) => {
    if (!booking) {
      return
    }

    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as KnexLike

    await knex.raw(
      `update rental_booking
       set status = 'cancelled', cancelled_by = 'system', cancellation_reason = 'reservation compensated', cancelled_at = now(), updated_at = now()
       where id = ?`,
      [booking.id]
    )

    await knex.raw(
      `insert into rental_booking_event (id, booking_id, from_status, to_status, actor_type, meta, created_at, updated_at)
       values (?, ?, 'held', 'cancelled', 'system', ?, now(), now())`,
      [
        generateEntityId(undefined, "rbe"),
        booking.id,
        JSON.stringify({ reason: "reservation compensated" }),
      ]
    )
  }
)
