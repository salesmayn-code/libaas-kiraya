"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { formatPKR } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"

type BookingDetail = {
  id: string
  status: string
  event_date: string
  rental_start: string
  rental_end: string
  rental_fee: number
  cleaning_fee: number
  deposit_amount: number
  fulfillment_mode: string
  listed_price_snapshot?: unknown
  unit?: { tag_code?: string }
  listing?: {
    product?: {
      title?: string
      thumbnail?: string | null
      vendor?: { name?: string; city?: string; phone?: string; whatsapp?: string | null }
    }
  }
  deposit?: { amount: number; status: string; released_amount: number; captured_amount: number }
  inspection?: {
    id: string
    outcome: string
    total_deduction: number
    notes?: string | null
    status: string
    dispute_deadline: string
    dispute?: { id: string; status: string; reason: string } | null
  } | null
  reviewed?: boolean
  events?: { id: string; to_status: string; created_at: string; actor_type: string }[]
}

const TIMELINE = [
  { key: "confirmed", label: "Booked" },
  { key: "with_customer", label: "Handover" },
  { key: "returned", label: "Return" },
  { key: "settling", label: "Check" },
  { key: "completed", label: "Deposit back" },
]

function date(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState(false)
  const [rating, setRating] = useState("5")
  const [reviewBody, setReviewBody] = useState("")
  const [fit, setFit] = useState<"small" | "true" | "large">("true")

  async function act(path: string, body?: Record<string, unknown>) {
    setPendingAction(true)
    setActionError(null)

    try {
      await sdk.client.fetch(path, { method: "POST", body })
      window.location.reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "That action did not go through")
    } finally {
      setPendingAction(false)
    }
  }

  async function cancelBooking() {
    const reason = window.prompt("Why are you cancelling? (optional)")
    await act(`/store/me/bookings/${params.id}/cancel`, { reason: reason || undefined })
  }

  async function disputeInspection() {
    const reason = window.prompt("What is wrong with the inspection?")
    if (!reason) return
    await act(`/store/me/bookings/${params.id}/dispute`, { reason })
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault()
    await act(`/store/me/bookings/${params.id}/review`, {
      rating: Number(rating),
      fit,
      body: reviewBody || undefined,
    })
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await sdk.client.fetch<{ booking: BookingDetail; reviewed: boolean }>(
          `/store/me/bookings/${params.id}`
        )
        if (active) setBooking({ ...result.booking, reviewed: result.reviewed })
      } catch {
        if (active) setError("We could not load this booking.")
      }
    }

    load()
    return () => {
      active = false
    }
  }, [params.id])

  if (error) {
    return (
      <main>
        <Container className="py-14">
          <p className="text-sm text-khatra">{error}</p>
          <Link href="/account/bookings" className="mt-4 inline-block text-sm text-shahtoot underline">
            Back to bookings
          </Link>
        </Container>
      </main>
    )
  }

  if (!booking) {
    return (
      <main>
        <Container className="py-14">
          <p className="text-sm text-dhundla">Loading booking…</p>
        </Container>
      </main>
    )
  }

  const currentIndex = TIMELINE.findIndex((step) => step.key === booking.status)

  return (
    <main>
      <Container className="py-10">
        <Link href="/account/bookings" className="text-sm text-dhundla hover:text-shahtoot">
          ← My bookings
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-dhundla">
              {booking.listing?.product?.vendor?.name ?? "Boutique"} ·{" "}
              {booking.listing?.product?.vendor?.city ?? ""}
            </p>
            <h1 className="mt-1 font-display text-4xl text-shahtoot">
              {booking.listing?.product?.title ?? "Rental outfit"}
            </h1>
            <p className="mt-2 text-sm text-dhundla">
              {date(booking.rental_start)} to {date(booking.rental_end)} · event{" "}
              {date(booking.event_date)}
            </p>
          </div>
          <span className="rounded-full bg-chandni px-3 py-1 text-xs font-medium text-syahi">
            {booking.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-control border border-lakeer bg-surface p-6">
            <h2 className="text-sm font-semibold text-syahi">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {TIMELINE.map((step, index) => {
                const reached = currentIndex >= 0 && index <= currentIndex
                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={
                        reached
                          ? "mt-1 size-3 rounded-full bg-mor"
                          : "mt-1 size-3 rounded-full border border-lakeer bg-surface"
                      }
                    />
                    <div>
                      <p className={reached ? "font-medium text-syahi" : "text-dhundla"}>
                        {step.label}
                      </p>
                      {index === currentIndex ? (
                        <p className="text-xs text-dhundla">Current step</p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="mt-6 border-t border-lakeer pt-4">
              <h2 className="text-sm font-semibold text-syahi">Next action</h2>
              <p className="mt-2 text-sm text-dhundla">
                {booking.status === "confirmed"
                  ? `Handover on ${date(booking.rental_start)}. The boutique will mark it handed over.`
                  : booking.status === "with_customer"
                    ? `Return the outfit by ${date(booking.rental_end)}.`
                    : booking.status === "returned"
                      ? "The boutique is checking the outfit. The deposit is released if they do not file an inspection in 48 hours."
                      : booking.status === "settling"
                        ? "An inspection has been filed. Accept or dispute it before the deadline."
                        : booking.status === "completed"
                          ? `Deposit settled. ${booking.deposit?.released_amount ? formatPKR(booking.deposit.released_amount) : ""} returned.`
                          : "No action needed right now."}
              </p>
            </div>

            {actionError ? <p className="mt-4 text-sm text-khatra">{actionError}</p> : null}

            {booking.status === "settling" && booking.inspection ? (
              <div className="mt-6 border-t border-lakeer pt-4">
                <h2 className="text-sm font-semibold text-syahi">Inspection result</h2>
                <p className="mt-2 text-sm text-dhundla">
                  {booking.inspection.outcome.replace(/_/g, " ")} · deduction{" "}
                  {formatPKR(booking.inspection.total_deduction)} · decide by{" "}
                  {date(booking.inspection.dispute_deadline)}
                </p>
                {booking.inspection.notes ? (
                  <p className="mt-2 text-sm text-syahi">“{booking.inspection.notes}”</p>
                ) : null}
                {booking.inspection.status === "needs_admin_review" ? (
                  <p className="mt-3 text-sm text-intezar">
                    Our team is reviewing the proposed deduction before you respond.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={pendingAction}
                      onClick={() => act(`/store/me/bookings/${params.id}/inspection/accept`)}
                    >
                      Accept and release deposit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pendingAction}
                      onClick={disputeInspection}
                    >
                      Dispute
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {booking.status === "disputed" ? (
              <div className="mt-6 border-t border-lakeer pt-4">
                <p className="text-sm text-intezar">
                  Under review by our team. The 3-day resolution target applies.
                </p>
              </div>
            ) : null}

            {booking.status === "confirmed" ? (
              <div className="mt-6 border-t border-lakeer pt-4">
                <Button size="sm" variant="secondary" disabled={pendingAction} onClick={cancelBooking}>
                  Cancel booking
                </Button>
                <p className="mt-2 text-xs text-dhundla">
                  Refund follows the boutique&apos;s cancellation policy. The deposit is always
                  released in full.
                </p>
              </div>
            ) : null}

            {booking.status === "completed" && !booking.reviewed ? (
              <form onSubmit={submitReview} className="mt-6 border-t border-lakeer pt-4 space-y-3">
                <h2 className="text-sm font-semibold text-syahi">Review this outfit</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-syahi">
                    Rating
                    <select
                      value={rating}
                      onChange={(event) => setRating(event.target.value)}
                      className="mt-1 w-full rounded-control border border-lakeer px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} stars
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-syahi">
                    Fit
                    <select
                      value={fit}
                      onChange={(event) => setFit(event.target.value as typeof fit)}
                      className="mt-1 w-full rounded-control border border-lakeer px-3 py-2 text-sm"
                    >
                      <option value="small">Ran small</option>
                      <option value="true">True to size</option>
                      <option value="large">Ran large</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-syahi">
                  Your review
                  <textarea
                    value={reviewBody}
                    onChange={(event) => setReviewBody(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-control border border-lakeer px-3 py-2 text-sm"
                  />
                </label>
                <Button type="submit" size="sm" disabled={pendingAction}>
                  Submit review
                </Button>
              </form>
            ) : null}
          </section>

          <aside className="h-fit space-y-4">
            <div className="rounded-control border border-lakeer bg-surface p-5">
              <h2 className="text-sm font-semibold text-syahi">Price</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-dhundla">Rental</dt>
                  <dd className="text-syahi">{formatPKR(booking.rental_fee)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-dhundla">Cleaning</dt>
                  <dd className="text-syahi">{formatPKR(booking.cleaning_fee)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-dhundla">Deposit</dt>
                  <dd className="text-syahi">{formatPKR(booking.deposit_amount)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-dhundla">Deposit status</dt>
                  <dd className="text-syahi capitalize">{booking.deposit?.status ?? "—"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-control border border-lakeer bg-surface p-5">
              <h2 className="text-sm font-semibold text-syahi">Collection</h2>
              <p className="mt-2 text-sm text-dhundla">
                {booking.fulfillment_mode === "courier"
                  ? "Courier delivery and return."
                  : "Pickup from the boutique."}
              </p>
              {booking.unit?.tag_code ? (
                <p className="mt-2 text-xs text-dhundla">Unit {booking.unit.tag_code}</p>
              ) : null}
              <p className="mt-4 text-xs text-dhundla">Need help?</p>
              <Button variant="secondary" size="sm" className="mt-2" disabled>
                Message boutique (coming soon)
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  )
}
