"use client"

import { sdk } from "@/lib/sdk"

const CART_KEY = "libaas.cart_id"

export type CartItem = {
  id: string
  title: string
  subtitle?: string | null
  thumbnail?: string | null
  unit_price: number
  total: number
  quantity: number
  metadata?: Record<string, unknown> | null
}

export type Cart = {
  id: string
  customer_id?: string | null
  currency_code: string
  region_id?: string | null
  email?: string | null
  items?: CartItem[]
  subtotal: number
  total: number
  payment_collection?: { id: string } | null
}

function readCartId() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(CART_KEY)
}

function storeCartId(cartId: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CART_KEY, cartId)
}

export async function clearCartId() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(CART_KEY)
}

export async function isSignedIn() {
  try {
    await sdk.store.customer.retrieve()
    return true
  } catch {
    return false
  }
}

async function createCart() {
  const { regions } = await sdk.store.region.list()
  const region = regions[0]

  if (!region) {
    throw new Error("No region is configured yet")
  }

  const { cart } = await sdk.store.cart.create({ region_id: region.id })
  storeCartId(cart.id)
  return cart as unknown as Cart
}

export async function ensureCart(): Promise<Cart> {
  const existing = readCartId()

  if (existing) {
    try {
      const { cart } = await sdk.store.cart.retrieve(existing, { fields: "*items" })
      return cart as unknown as Cart
    } catch {
      clearCartId()
    }
  }

  return createCart()
}

export async function getCart(): Promise<Cart | null> {
  const existing = readCartId()

  if (!existing) {
    return null
  }

  try {
    const { cart } = await sdk.store.cart.retrieve(existing, { fields: "*items" })
    return cart as unknown as Cart
  } catch {
    clearCartId()
    return null
  }
}

export async function addRentalToCart({
  listing_id,
  variant_spec_id,
  event_date,
  rental_start,
  rental_end,
}: {
  listing_id: string
  variant_spec_id: string
  event_date: string
  rental_start: string
  rental_end: string
}) {
  const cart = await ensureCart()

  await sdk.client.fetch(`/store/carts/${cart.id}/rentals`, {
    method: "POST",
    body: {
      listing_id,
      variant_spec_id,
      event_date,
      rental_start,
      rental_end,
    },
  })

  return cart
}
