"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { clearCartId, getCart, isSignedIn, type Cart } from "@/lib/cart"
import { formatPKR } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"

const inputClass =
  "mt-1 w-full rounded-control border border-lakeer bg-surface px-3 py-2 text-sm text-syahi outline-none focus:border-shahtoot"

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_1: "",
    city: "",
  })

  useEffect(() => {
    let active = true

    async function load() {
      const authenticated = await isSignedIn()

      if (!authenticated) {
        router.push("/account/login?next=/checkout")
        return
      }

      const current = await getCart()

      if (!current?.items?.length) {
        router.push("/cart")
        return
      }

      if (active) {
        setCart(current)
        setReady(true)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [router])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!cart) return
    setError(null)
    setPending(true)

    try {
      await sdk.store.cart.update(cart.id, {
        email: form.email,
        shipping_address: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          address_1: form.address_1,
          city: form.city,
          country_code: "pk",
        },
      })

      const fresh = await sdk.store.cart.retrieve(cart.id, { fields: "*items,*payment_collection" })
      await sdk.store.payment.initiatePaymentSession(fresh.cart, {
        provider_id: "pp_simulated-wallet_simulated-wallet",
      })

      const result = await sdk.client.fetch<{ order_id: string }>(
        `/store/rental-carts/${cart.id}/complete`,
        { method: "POST" }
      )

      clearCartId()
      router.push(`/account/bookings?confirmed=${result.order_id}`)
    } catch {
      setError(
        "Payment did not go through, or the hold expired. Your outfit stays reserved until the timer runs out."
      )
    } finally {
      setPending(false)
    }
  }

  if (!ready || !cart) {
    return (
      <main>
        <Container className="py-14">
          <p className="text-dhundla">Preparing checkout…</p>
        </Container>
      </main>
    )
  }

  return (
    <main>
      <Container className="py-10">
        <h1 className="font-display text-4xl text-shahtoot">Checkout</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <form onSubmit={onSubmit} className="space-y-4 rounded-control border border-lakeer bg-surface p-6">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-syahi">
                First name
                <input
                  required
                  value={form.first_name}
                  onChange={(event) => setForm({ ...form, first_name: event.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-syahi">
                Last name
                <input
                  value={form.last_name}
                  onChange={(event) => setForm({ ...form, last_name: event.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-syahi">
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-syahi">
              Phone (WhatsApp)
              <input
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-syahi">
              Address
              <input
                required
                value={form.address_1}
                onChange={(event) => setForm({ ...form, address_1: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-syahi">
              City
              <input
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className={inputClass}
              />
            </label>

            <div className="rounded-control bg-chandni p-4 text-sm text-dhundla">
              <p className="font-medium text-syahi">Simulated wallet</p>
              <p className="mt-1">
                This demo charges a simulated wallet. Replace it with JazzCash, Easypaisa or a card
                acquirer later; the booking and deposit flow stays the same.
              </p>
            </div>

            {error ? <p className="text-sm text-khatra">{error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Confirming…" : `Pay ${formatPKR(cart.total)} and confirm`}
            </Button>
          </form>

          <aside className="h-fit rounded-control border border-lakeer bg-surface p-5">
            <h2 className="text-sm font-semibold text-syahi">Order summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {cart.items?.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-dhundla">{item.title}</span>
                  <span className="font-medium text-syahi">{formatPKR(item.unit_price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between gap-3 border-t border-lakeer pt-4 text-base">
              <span className="font-semibold text-syahi">Total today</span>
              <span className="font-semibold text-shahtoot">{formatPKR(cart.total)}</span>
            </div>
            <p className="mt-3 text-xs text-dhundla">
              Includes refundable deposit.{" "}
              <Link href="/#how-it-works" className="underline">
                How the deposit works
              </Link>
            </p>
          </aside>
        </div>
      </Container>
    </main>
  )
}
