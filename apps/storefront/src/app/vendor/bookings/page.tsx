"use client"

import { useEffect, useState } from "react"
import { VendorBookingActions } from "@/components/vendor-booking-actions"
import { VendorShell } from "@/components/vendor-shell"
import { customerName, formatDate, type VendorBooking } from "@/lib/vendor"
import { sdk } from "@/lib/sdk"

const STATUSES = [
  "all",
  "confirmed",
  "with_customer",
  "returned",
  "settling",
  "disputed",
  "completed",
  "cancelled",
]

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<VendorBooking[]>([])
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)

  async function load(nextStatus = status) {
    setLoading(true)
    try {
      const query = nextStatus === "all" ? "" : `&status=${nextStatus}`
      const result = await sdk.client.fetch<{ bookings: VendorBooking[] }>(
        `/vendor/bookings?limit=100${query}`
      )
      setBookings(result.bookings)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <VendorShell title="Bookings" subtitle="Every rental, with the next action attached.">
      <label className="text-sm font-medium text-syahi">
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="ml-2 rounded-control border border-lakeer bg-surface px-3 py-2 text-sm"
        >
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All" : option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="mt-6 text-sm text-dhundla">Loading bookings…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-control border border-lakeer bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-lakeer text-xs text-dhundla">
              <tr>
                <th className="px-4 py-3">Outfit</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-lakeer last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-syahi">
                      {booking.listing?.product?.title ?? "Rental outfit"}
                    </p>
                    <p className="text-xs text-dhundla">{booking.unit?.tag_code ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-dhundla">{customerName(booking)}</td>
                  <td className="px-4 py-3 text-dhundla">
                    {formatDate(booking.rental_start)} – {formatDate(booking.rental_end)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-chandni px-2 py-1 text-xs capitalize text-syahi">
                      {booking.status.replace(/_/g, " ")}
                    </span>
                    {booking.ops_flag !== "none" ? (
                      <span className="ml-2 text-xs text-intezar">{booking.ops_flag}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <VendorBookingActions booking={booking} onChanged={() => load(status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!bookings.length ? (
            <p className="px-4 py-8 text-center text-sm text-dhundla">No bookings in this state.</p>
          ) : null}
        </div>
      )}
    </VendorShell>
  )
}
