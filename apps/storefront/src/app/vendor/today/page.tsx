"use client"

import { useEffect, useState } from "react"
import { VendorBookingActions } from "@/components/vendor-booking-actions"
import { VendorShell } from "@/components/vendor-shell"
import { Button } from "@/components/ui/button"
import { customerName, formatDate, type VendorBooking } from "@/lib/vendor"
import { formatPKR } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"

const ACTIONABLE = new Set(["confirmed", "with_customer", "returned"])

export default function VendorTodayPage() {
  const [bookings, setBookings] = useState<VendorBooking[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const result = await sdk.client.fetch<{ bookings: VendorBooking[] }>("/vendor/bookings?limit=100")
      setBookings(result.bookings)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  const due = bookings.filter((booking) => ACTIONABLE.has(booking.status))

  return (
    <VendorShell title="Today" subtitle="Handovers, returns and checks that need you.">
      {loading ? (
        <p className="text-sm text-dhundla">Loading today’s actions…</p>
      ) : due.length ? (
        <ul className="space-y-3">
          {due.map((booking) => (
            <li key={booking.id} className="rounded-control border border-lakeer bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-dhundla">
                    {booking.status === "confirmed"
                      ? "Handover due"
                      : booking.status === "with_customer"
                        ? "Return expected"
                        : "Inspection due"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-syahi">
                    {booking.listing?.product?.title ?? "Rental outfit"}
                  </h2>
                  <p className="mt-1 text-sm text-dhundla">
                    {customerName(booking)} · {booking.unit?.tag_code ?? "Unit"} · {formatDate(booking.rental_start)} to{" "}
                    {formatDate(booking.rental_end)}
                  </p>
                  <p className="mt-1 text-sm text-syahi">
                    {formatPKR(booking.rental_fee)} rental · {formatPKR(booking.deposit_amount)} deposit
                  </p>
                </div>
                <VendorBookingActions booking={booking} onChanged={load} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
          <p className="font-medium text-syahi">Nothing due right now</p>
          <p className="mt-1 text-sm text-dhundla">Handovers and returns will appear here.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
            Refresh
          </Button>
        </div>
      )}
    </VendorShell>
  )
}
