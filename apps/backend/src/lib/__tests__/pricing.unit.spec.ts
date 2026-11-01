import fc from "fast-check"
import {
  addCalendarDays,
  blockedPeriod,
  cancellationRefund,
  deductionTotal,
  diffCalendarDays,
  formatCalendarDate,
  inclusiveDays,
  lateFee,
  parseCalendarDate,
  quote,
  PricingError,
  type PricingRules,
} from "../pricing"

const baseRules: PricingRules = {
  base_amount: 18000,
  base_days: 3,
  extra_day_amount: 5000,
  cleaning_fee_amount: 1500,
  deposit_amount: 20000,
  late_fee_amount: 1500,
  min_days: 2,
  max_days: 7,
  lead_buffer_days: 1,
  return_buffer_days: 2,
  commission_bps: 1200,
}

describe("pricing", () => {
  it("computes the base package fee for exactly base_days", () => {
    const result = quote(baseRules, { rental_start: "2026-12-11", rental_end: "2026-12-13" })

    expect(result.days).toBe(3)
    expect(result.rental_fee).toBe(18000)
    expect(result.platform_fee).toBe(2160)
    expect(result.total_today).toBe(18000 + 1500 + 20000)
  })

  it("adds extra day amounts beyond the base package", () => {
    const result = quote(baseRules, { rental_start: "2026-12-11", rental_end: "2026-12-15" })

    expect(result.days).toBe(5)
    expect(result.rental_fee).toBe(18000 + 2 * 5000)
    expect(result.platform_fee).toBe(Math.round((28000 * 1200) / 10000))
  })

  it("expands the blocked period with lead and return buffers", () => {
    const period = blockedPeriod(baseRules, "2026-12-11", "2026-12-13")

    expect(period.blocked_start).toBe("2026-12-10")
    expect(period.blocked_end).toBe("2026-12-15")
  })

  it("rejects ranges outside min/max days", () => {
    expect(() => quote(baseRules, { rental_start: "2026-12-11", rental_end: "2026-12-11" })).toThrow(
      PricingError
    )
    expect(() =>
      quote(baseRules, { rental_start: "2026-12-01", rental_end: "2026-12-31" })
    ).toThrow(PricingError)
  })

  it("caps deductions at the deposit", () => {
    expect(deductionTotal({ damage: 25000, late_fee: 3000, deposit_amount: 20000 })).toBe(20000)
    expect(deductionTotal({ damage: 0, late_fee: 0, deposit_amount: 20000 })).toBe(0)
    expect(deductionTotal({ damage: 5000, late_fee: 1500, deposit_amount: 20000 })).toBe(6500)
  })

  it("computes late fees per day", () => {
    expect(lateFee(baseRules, 0)).toBe(0)
    expect(lateFee(baseRules, 2)).toBe(3000)
  })

  describe("cancellation refunds", () => {
    const base = {
      rental_fee: 18000,
      cleaning_fee: 1500,
      deposit_amount: 20000,
    }

    it("refunds everything at the flexible full-refund boundary", () => {
      const result = cancellationRefund({
        policy: "flexible",
        rental_start: "2026-12-11",
        cancelled_on: "2026-12-08",
        ...base,
      })

      expect(result.tier).toBe("full")
      expect(result.fee_refund).toBe(18000)
      expect(result.cleaning_refund).toBe(1500)
      expect(result.deposit_release).toBe(20000)
    })

    it("refunds half between the flexible tiers", () => {
      const result = cancellationRefund({
        policy: "flexible",
        rental_start: "2026-12-11",
        cancelled_on: "2026-12-09",
        ...base,
      })

      expect(result.tier).toBe("half")
      expect(result.fee_refund).toBe(9000)
    })

    it("refunds nothing inside the no-refund window", () => {
      const result = cancellationRefund({
        policy: "standard",
        rental_start: "2026-12-11",
        cancelled_on: "2026-12-09",
        ...base,
      })

      expect(result.tier).toBe("none")
      expect(result.fee_refund).toBe(0)
      expect(result.cleaning_refund).toBe(1500)
    })

    it("honours strict policy boundaries", () => {
      const atBoundary = cancellationRefund({
        policy: "strict",
        rental_start: "2026-12-25",
        cancelled_on: "2026-12-11",
        ...base,
      })
      const justInside = cancellationRefund({
        policy: "strict",
        rental_start: "2026-12-25",
        cancelled_on: "2026-12-12",
        ...base,
      })

      expect(atBoundary.tier).toBe("full")
      expect(justInside.tier).toBe("half")
    })
  })

  it("is monotonic: cancelling earlier never refunds less", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 }), fc.integer({ min: 0, max: 40 }), (a, b) => {
        const earlier = Math.max(a, b)
        const later = Math.min(a, b)

        const earlierRefund = cancellationRefund({
          policy: "standard",
          rental_start: "2026-12-31",
          cancelled_on: addCalendarDays("2026-12-31", -earlier),
          rental_fee: 10000,
          cleaning_fee: 0,
          deposit_amount: 0,
        })

        const laterRefund = cancellationRefund({
          policy: "standard",
          rental_start: "2026-12-31",
          cancelled_on: addCalendarDays("2026-12-31", -later),
          rental_fee: 10000,
          cleaning_fee: 0,
          deposit_amount: 0,
        })

        return earlierRefund.fee_refund >= laterRefund.fee_refund
      })
    )
  })

  it("round-trips calendar dates and day arithmetic", () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date(Date.UTC(2026, 0, 1)),
          max: new Date(Date.UTC(2030, 11, 31)),
          noInvalidDate: true,
        }),
        fc.integer({ min: -60, max: 60 }),
        (date, offset) => {
          const value = formatCalendarDate(date.getTime())
          const shifted = addCalendarDays(value, offset)

          expect(diffCalendarDays(shifted, value)).toBe(offset)
          expect(inclusiveDays(value, addCalendarDays(value, 3))).toBe(4)
          expect(parseCalendarDate(value)).toBe(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
          )
        }
      )
    )
  })
})
