"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { getCart, isSignedIn, type Cart } from "@/lib/cart"
import { sdk } from "@/lib/sdk"
import { formatPKR } from "@/lib/rentals"

function meta(item: { metadata?: Record<string, unknown> | null }, key: string) {
  const value = item.metadata?.[key]
  return typeof value === "string" ? value : undefined
}

function useHoldCountdown(cart: Cart | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const expiries = (cart?.items ?? [])
    .map((item) => meta(item, "hold_expires_at"))
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))

  if (!expiries.length) {
    return null
  }

  const remaining = Math.min(...expiries) - now
  return {
    remaining,
    expired: remaining <= 0,
    label: `${Math.max(0, Math.floor(remaining / 60000))}:${String(
      Math.max(0, Math.floor((remaining % 60000) / 1000))
    ).padStart(2, "0")}`,
  }
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const hold = useHoldCountdown(cart)

  async function removeItem(bookingId: string) {
    if (!cart) return
    setRemoving(bookingId)
    setRemoveError(null)

    try {
      await sdk.client.fetch(`/store/carts/${cart.id}/rentals/${bookingId}`, {
        method: "DELETE",
      })
      const updated = await getCart()
      setCart(updated)
    } catch {
      setRemoveError("Could not remove that item. Try again.")
    } finally {
      setRemoving(null)
    }
  }

  useEffect(() => {
    let active = true

    async function load() {
      const authenticated = await isSignedIn()

      if (!active) return
      setSignedIn(authenticated)

      if (authenticated) {
        const current = await getCart()
        if (active) setCart(current)
      }

      if (active) setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <main>
        <Container className="py-14">
          <p className="text-dhundla">Loading your cart…</p>
        </Container>
      </main>
    )
  }

  if (!signedIn) {
    return (
      <main>
        <Container className="py-14">
          <div className="mx-auto max-w-lg rounded-control border border-lakeer bg-surface p-8 text-center">
            <h1 className="font-display text-3xl text-shahtoot">Sign in to hold your outfit</h1>
            <p className="mt-2 text-sm text-dhundla">
              Reservations are tied to a customer account so the boutique knows who is coming.
            </p>
            <Button className="mt-6" onClick={() => router.push("/account/login?next=/cart")}>
              Sign in
            </Button>
          </div>
        </Container>
      </main>
    )
  }

  if (!cart || !cart.items?.length) {
    return (
      <main>
        <Container className="py-14">
          <div className="mx-auto max-w-lg rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
            <h1 className="font-display text-3xl text-shahtoot">Your cart is empty</h1>
            <p className="mt-2 text-sm text-dhundla">
              Find something free on your date and it will wait here for 15 minutes.
            </p>
            <Link href="/search" className="mt-6 inline-flex text-sm font-medium text-shahtoot hover:underline">
              Browse outfits
            </Link>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main>
      <Container className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl text-shahtoot">Your cart</h1>
          {hold ? (
            <p
              className={
                hold.expired
                  ? "rounded-control bg-khatra/10 px-3 py-2 text-sm text-khatra"
                  : "rounded-control bg-mor/10 px-3 py-2 text-sm text-mor"
              }
            >
              {hold.expired
                ? "The hold has expired. Reserve the outfit again."
                : `Reserved for you for ${hold.label}`}
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-4">
            {removeError ? <p className="text-sm text-khatra">{removeError}</p> : null}
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-control border border-lakeer bg-surface p-4">
                <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-image bg-sang">
                  {item.thumbnail ? (
                    <Image src={item.thumbnail} alt={item.title} fill sizes="96px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-syahi">{item.title}</p>
                  <p className="mt-1 text-sm text-dhundla">
                    {meta(item, "rental_start")} to {meta(item, "rental_end")}
                  </p>
                  <p className="mt-1 text-sm text-dhundla">
                    Event {meta(item, "event_date")}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-shahtoot">
                    {formatPKR(item.unit_price)}
                  </p>
                  <p className="text-xs text-dhundla">
                    Includes {formatPKR(Number(meta(item, "deposit_amount") ?? 0))} refundable deposit
                  </p>
                  {meta(item, "booking_id") ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-0 text-dhundla hover:text-khatra"
                      disabled={removing === meta(item, "booking_id")}
                      onClick={() => removeItem(meta(item, "booking_id")!)}
                    >
                      {removing === meta(item, "booking_id") ? "Removing…" : "Remove"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-control border border-lakeer bg-surface p-5">
            <h2 className="text-sm font-semibold text-syahi">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-dhundla">Subtotal</dt>
                <dd className="font-medium text-syahi">{formatPKR(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-lakeer pt-3 text-base">
                <dt className="font-semibold text-syahi">Total today</dt>
                <dd className="font-semibold text-shahtoot">{formatPKR(cart.total)}</dd>
              </div>
            </dl>
            <Button
              className="mt-5 w-full"
              disabled={hold?.expired}
              onClick={() => router.push("/checkout")}
            >
              {hold?.expired ? "Reserve again" : "Continue to checkout"}
            </Button>
            <p className="mt-2 text-xs text-dhundla">
              You will not be charged twice. The deposit is part of today&apos;s total and is
              refunded after the return check.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  )
}
