const DAY_MS = 86_400_000

export type CancellationPolicy = "flexible" | "standard" | "strict"

export type PricingRules = {
  base_amount: number
  base_days: number
  extra_day_amount: number
  cleaning_fee_amount: number
  deposit_amount: number
  late_fee_amount: number
  min_days: number
  max_days: number
  lead_buffer_days: number
  return_buffer_days: number
  commission_bps: number
}

export type QuoteInput = {
  rental_start: string
  rental_end: string
}

export type Quote = {
  days: number
  rental_fee: number
  cleaning_fee: number
  deposit_amount: number
  platform_fee: number
  total_today: number
  blocked_start: string
  blocked_end: string
  currency_code: "pkr"
}

export class PricingError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "PricingError"
    this.code = code
  }
}

export function parseCalendarDate(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    throw new PricingError("INVALID_DATE", `Expected YYYY-MM-DD, received ${value}`)
  }

  const [, year, month, day] = match
  const ms = Date.UTC(Number(year), Number(month) - 1, Number(day))
  const date = new Date(ms)

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new PricingError("INVALID_DATE", `${value} is not a real calendar date`)
  }

  return ms
}

export function formatCalendarDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addCalendarDays(value: string, days: number): string {
  return formatCalendarDate(parseCalendarDate(value) + days * DAY_MS)
}

export function diffCalendarDays(later: string, earlier: string): number {
  return Math.round((parseCalendarDate(later) - parseCalendarDate(earlier)) / DAY_MS)
}

export function inclusiveDays(start: string, end: string): number {
  return diffCalendarDays(end, start) + 1
}

export function blockedPeriod(
  rules: Pick<PricingRules, "lead_buffer_days" | "return_buffer_days">,
  rental_start: string,
  rental_end: string
) {
  return {
    blocked_start: addCalendarDays(rental_start, -rules.lead_buffer_days),
    blocked_end: addCalendarDays(rental_end, rules.return_buffer_days),
  }
}

export function quote(rules: PricingRules, input: QuoteInput): Quote {
  const days = inclusiveDays(input.rental_start, input.rental_end)

  if (days < 1) {
    throw new PricingError("INVALID_RANGE", "The return date cannot be before the handover date")
  }

  if (days < rules.min_days || days > rules.max_days) {
    throw new PricingError(
      "OUT_OF_RANGE",
      `This outfit rents for ${rules.min_days} to ${rules.max_days} days`
    )
  }

  const extraDays = Math.max(0, days - rules.base_days)
  const rental_fee = rules.base_amount + extraDays * rules.extra_day_amount
  const platform_fee = Math.round((rental_fee * rules.commission_bps) / 10_000)
  const cleaning_fee = rules.cleaning_fee_amount
  const deposit_amount = rules.deposit_amount

  return {
    days,
    rental_fee,
    cleaning_fee,
    deposit_amount,
    platform_fee,
    total_today: rental_fee + cleaning_fee + deposit_amount,
    ...blockedPeriod(rules, input.rental_start, input.rental_end),
    currency_code: "pkr",
  }
}

export function lateFee(rules: Pick<PricingRules, "late_fee_amount">, daysLate: number): number {
  return Math.max(0, daysLate) * rules.late_fee_amount
}

export function deductionTotal({
  damage,
  late_fee,
  deposit_amount,
}: {
  damage: number
  late_fee: number
  deposit_amount: number
}): number {
  return Math.min(Math.max(0, damage) + Math.max(0, late_fee), Math.max(0, deposit_amount))
}

const POLICY_TIERS: Record<CancellationPolicy, { full: number; half: number }> = {
  flexible: { full: 3, half: 1 },
  standard: { full: 7, half: 3 },
  strict: { full: 14, half: 7 },
}

export type RefundTier = "full" | "half" | "none"

export type CancellationRefund = {
  tier: RefundTier
  fee_refund: number
  cleaning_refund: number
  deposit_release: number
  total_refund: number
}

export function cancellationRefund({
  policy,
  rental_start,
  cancelled_on,
  rental_fee,
  cleaning_fee,
  deposit_amount,
}: {
  policy: CancellationPolicy
  rental_start: string
  cancelled_on: string
  rental_fee: number
  cleaning_fee: number
  deposit_amount: number
}): CancellationRefund {
  const daysBefore = diffCalendarDays(rental_start, cancelled_on)
  const tiers = POLICY_TIERS[policy]

  let tier: RefundTier = "none"

  if (daysBefore >= tiers.full) {
    tier = "full"
  } else if (daysBefore >= tiers.half) {
    tier = "half"
  }

  const fraction = tier === "full" ? 1 : tier === "half" ? 0.5 : 0
  const fee_refund = Math.round(rental_fee * fraction)
  const cleaning_refund = cleaning_fee

  return {
    tier,
    fee_refund,
    cleaning_refund,
    deposit_release: deposit_amount,
    total_refund: fee_refund + cleaning_refund,
  }
}
