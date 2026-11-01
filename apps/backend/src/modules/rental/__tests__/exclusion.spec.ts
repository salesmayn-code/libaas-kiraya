import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import type RentalModuleService from "../service"

jest.setTimeout(180_000)

function bookingInput({
  listingId,
  unitId,
  start,
  end,
  blockedStart,
  blockedEnd,
}: {
  listingId: string
  unitId: string
  start: string
  end: string
  blockedStart: string
  blockedEnd: string
}) {
  return {
    listing_id: listingId,
    unit_id: unitId,
    variant_id: "variant_test",
    vendor_id: "ven_test",
    customer_id: "cus_test",
    event_date: new Date(`${start}T00:00:00.000Z`),
    rental_start: new Date(`${start}T00:00:00.000Z`),
    rental_end: new Date(`${end}T00:00:00.000Z`),
    blocked_start: new Date(`${blockedStart}T00:00:00.000Z`),
    blocked_end: new Date(`${blockedEnd}T00:00:00.000Z`),
    days: 3,
    status: "held" as const,
    ops_flag: "none" as const,
    hold_expires_at: new Date(Date.now() + 15 * 60_000),
    fulfillment_mode: "pickup" as const,
    currency_code: "pkr",
    rental_fee: 18_000,
    cleaning_fee: 1_500,
    deposit_amount: 20_000,
    platform_fee: 2_160,
    pricing_snapshot: { cancellation_policy: "standard" },
  }
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("rental exclusion constraint", () => {
      it("rejects a second overlapping booking on the same unit", async () => {
        const rentalService: RentalModuleService = getContainer().resolve("rental")

        const listing = await rentalService.createRentalListings({
          product_id: "prod_test",
          vendor_id: "ven_test",
          city: "Islamabad",
          status: "active",
          base_amount: 18_000,
          base_days: 3,
          extra_day_amount: 5_000,
          cleaning_fee_amount: 1_500,
          deposit_amount: 20_000,
          late_fee_amount: 1_500,
          lead_buffer_days: 1,
          return_buffer_days: 2,
          min_days: 2,
          max_days: 7,
          fulfillment_modes: ["pickup"],
          cancellation_policy: "standard",
        })

        const unit = await rentalService.createRentalUnits({
          listing_id: listing.id,
          variant_id: "variant_test",
          vendor_id: "ven_test",
          tag_code: "TEST-001",
          condition_grade: "A",
          status: "active",
        })

        await rentalService.createRentalBookings(
          bookingInput({
            listingId: listing.id,
            unitId: unit.id,
            start: "2027-01-10",
            end: "2027-01-12",
            blockedStart: "2027-01-09",
            blockedEnd: "2027-01-14",
          })
        )

        await expect(
          rentalService.createRentalBookings(
            bookingInput({
              listingId: listing.id,
              unitId: unit.id,
              start: "2027-01-12",
              end: "2027-01-14",
              blockedStart: "2027-01-11",
              blockedEnd: "2027-01-16",
            })
          )
        ).rejects.toMatchObject({
          code: "23P01",
        })
      })
    })
  },
})
