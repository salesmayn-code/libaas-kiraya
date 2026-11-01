"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addDays, format, parseISO } from "date-fns"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addRentalToCart, isSignedIn } from "@/lib/cart"
import { fitFor, type MeasurementProfile } from "@/lib/fit"
import { formatPKR, type RentalListing } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"
import { cn } from "@/lib/utils"

type Quote = {
  days: number
  rental_fee: number
  cleaning_fee: number
  deposit_amount: number
  total_today: number
  blocked_start: string
  blocked_end: string
}

function defaultEventDate() {
  return format(addDays(new Date(), 14), "yyyy-MM-dd")
}

export function BookingPanel({ listing }: { listing: RentalListing }) {
  const router = useRouter()
  const [variantSpecId, setVariantSpecId] = useState(listing.variants[0]?.id)
  const [eventDate, setEventDate] = useState(defaultEventDate())
  const [quote, setQuote] = useState<Quote | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<MeasurementProfile | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rentalStart = format(addDays(parseISO(eventDate), -1), "yyyy-MM-dd")
  const rentalEnd = format(addDays(parseISO(eventDate), 1), "yyyy-MM-dd")
  const selectedVariant = listing.variants.find((variant) => variant.id === variantSpecId)
  const fit = fitFor(profile, selectedVariant?.measurements)

  useEffect(() => {
    sdk.client
      .fetch<{ profiles: MeasurementProfile[] }>("/store/me/measurements")
      .then((result) => setProfile(result.profiles.find((item) => item.is_default) ?? result.profiles[0]))
      .catch(() => setProfile(undefined))
  }, [])

  useEffect(() => {
    if (!variantSpecId) return

    let cancelled = false

    async function loadQuote() {
      setLoading(true)
      setError(null)

      try {
        const result = await sdk.client.fetch<{
          quote: Quote
          available: boolean
          available_units: number
        }>("/store/rentals/quote", {
          method: "POST",
          body: {
            listing_id: listing.id,
            variant_spec_id: variantSpecId,
            event_date: eventDate,
            rental_start: rentalStart,
            rental_end: rentalEnd,
          },
        })

        if (!cancelled) {
          setQuote(result.quote)
          setAvailable(result.available)
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null)
          setAvailable(false)
          setError(err instanceof Error ? err.message : "Could not check this date")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadQuote()

    return () => {
      cancelled = true
    }
  }, [eventDate, listing.id, rentalEnd, rentalStart, variantSpecId])

  async function onReserve() {
    if (!variantSpecId) return
    setError(null)

    if (!(await isSignedIn())) {
      router.push(`/account/login?next=/listings/${listing.id}`)
      return
    }

    if (!available) {
      setError("That size is not free for these dates. Try another date or size.")
      return
    }

    try {
      setLoading(true)
      await addRentalToCart({
        listing_id: listing.id,
        variant_spec_id: variantSpecId,
        event_date: eventDate,
        rental_start: rentalStart,
        rental_end: rentalEnd,
      })
      router.push("/cart")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reserve this outfit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-control border border-lakeer bg-surface p-4">
      <div>
        <p className="text-sm font-semibold text-syahi">Size</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a size">
          {listing.variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              aria-pressed={variant.id === variantSpecId}
              onClick={() => setVariantSpecId(variant.id)}
              className={cn(
                "min-h-11 min-w-11 rounded-control border px-3 text-sm font-medium",
                variant.id === variantSpecId
                  ? "border-shahtoot bg-shahtoot text-white"
                  : "border-lakeer bg-surface text-syahi hover:border-shahtoot/40"
              )}
            >
              {variant.size_label}
            </button>
          ))}
        </div>
      </div>

      {selectedVariant ? (
        <p className="mt-2 text-xs text-dhundla">
          {Object.entries(selectedVariant.measurements)
            .map(([key, value]) => `${key.replace(/_in$/, "").replace(/_/g, " ")} ${value} in`)
            .join(" · ")}
        </p>
      ) : null}

      {fit.status !== "unknown" ? (
        <p
          className={
            fit.status === "fits"
              ? "mt-2 text-xs font-medium text-mor"
              : "mt-2 text-xs font-medium text-intezar"
          }
        >
          {fit.message}
        </p>
      ) : profile ? null : (
        <p className="mt-2 text-xs text-dhundla">
          <a href="/account/measurements" className="underline">
            Add measurements
          </a>{" "}
          to see your fit.
        </p>
      )}

      <div className="mt-4">
        <label htmlFor="event-date" className="text-sm font-semibold text-syahi">
          Event date
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-control border border-lakeer px-3 py-2">
          <CalendarDays aria-hidden className="size-5 text-dhundla" strokeWidth={1.5} />
          <input
            id="event-date"
            type="date"
            value={eventDate}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(event) => setEventDate(event.target.value)}
            className="w-full bg-transparent text-sm text-syahi outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-dhundla">
          The default package is 3 days: {rentalStart} to {rentalEnd}.
        </p>
      </div>

      <dl className="mt-4 space-y-2 border-t border-lakeer pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-dhundla">Rental{quote ? ` (${quote.days} days)` : ""}</dt>
          <dd className="font-medium text-syahi">
            {quote ? formatPKR(quote.rental_fee) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-dhundla">Cleaning</dt>
          <dd className="font-medium text-syahi">
            {quote ? formatPKR(quote.cleaning_fee) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-dhundla">Refundable deposit</dt>
          <dd className="font-medium text-syahi">
            {quote ? formatPKR(quote.deposit_amount) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-lakeer pt-3 text-base">
          <dt className="font-semibold text-syahi">Total today</dt>
          <dd className="font-semibold text-shahtoot">
            {quote ? formatPKR(quote.total_today) : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-dhundla">
        {available === true
          ? `${selectedVariant?.size_label ?? "This size"} is free for your dates.`
          : available === false
            ? "Not free for these dates. Try another date or size."
            : "Checking availability…"}
      </p>

      <Button onClick={onReserve} disabled={loading || available === false} className="mt-4 w-full">
        {loading ? "Checking…" : "Reserve for 15 minutes"}
      </Button>

      {error ? <p className="mt-2 text-sm text-khatra">{error}</p> : null}
    </div>
  )
}
