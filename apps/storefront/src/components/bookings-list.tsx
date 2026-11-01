"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatPKR } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"

type Booking = {
  id: string
  status: string
  event_date: string
  rental_start: string
  rental_end: string
  rental_fee: number
  deposit_amount: number
  listing?: {
    product?: {
      title?: string
      thumbnail?: string | null
      vendor?: { name?: string }
    }
  }
}

const STATUS_LABEL: Record<string, string> = {
  held: "Reserved",
  confirmed: "Confirmed",
  with_customer: "With you",
  returned: "Waiting for the check",
  settling: "Decision needed",
  disputed: "Under review",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function BookingsList() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [signedIn, setSignedIn] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await sdk.client.fetch<{ bookings: Booking[] }>("/store/me/bookings")
        if (active) setBookings(result.bookings)
      } catch {
        if (active) {
          setSignedIn(false)
          setBookings([])
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (!signedIn) {
    return (
      <div className="rounded-control border border-lakeer bg-surface p-8 text-center">
        <p className="text-lg font-medium text-syahi">Sign in to see your bookings</p>
        <Link href="/account/login?next=/account/bookings">
          <Button className="mt-4">Sign in</Button>
        </Link>
      </div>
    )
  }

  if (bookings === null) {
    return <p className="text-sm text-dhundla">Loading your bookings…</p>
  }

  if (!bookings.length) {
    return (
      <div className="rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
        <p className="text-lg font-medium text-syahi">You have no bookings yet</p>
        <p className="mt-2 text-sm text-dhundla">Find something free on your date.</p>
        <Link href="/search">
          <Button className="mt-4">Browse outfits</Button>
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {bookings.map((booking) => (
        <li key={booking.id} className="rounded-control border border-lakeer bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-dhundla">
                {booking.listing?.product?.vendor?.name ?? "Boutique"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-syahi">
                {booking.listing?.product?.title ?? "Rental outfit"}
              </h2>
              <p className="mt-1 text-sm text-dhundla">
                {date(booking.rental_start)} to {date(booking.rental_end)} · event{" "}
                {date(booking.event_date)}
              </p>
            </div>
            <span className="rounded-full bg-chandni px-3 py-1 text-xs font-medium text-syahi">
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-dhundla">
              {formatPKR(booking.rental_fee)} rental · {formatPKR(booking.deposit_amount)} deposit
            </p>
            <Link href={`/account/bookings/${booking.id}`}>
              <Button variant="secondary" size="sm">
                View booking
              </Button>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
