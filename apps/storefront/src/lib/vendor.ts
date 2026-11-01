"use client"

import { sdk } from "@/lib/sdk"

export type VendorBooking = {
  id: string
  status: string
  ops_flag: string
  event_date: string
  rental_start: string
  rental_end: string
  fulfillment_mode: string
  rental_fee: number
  deposit_amount: number
  customer_id: string
  customer?: { first_name?: string | null; last_name?: string | null; email?: string; phone?: string | null } | null
  listing?: { id: string; product?: { title?: string; thumbnail?: string | null } }
  unit?: { id: string; tag_code?: string }
  deposit?: { status?: string } | null
}

export type VendorListing = {
  id: string
  status: string
  city: string
  base_amount: number
  deposit_amount: number
  product?: { id: string; title?: string; thumbnail?: string | null }
  variants?: { id: string; size_label: string }[]
  units?: { id: string; status: string; tag_code: string }[]
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function customerName(booking: VendorBooking) {
  const first = booking.customer?.first_name ?? ""
  const last = booking.customer?.last_name ?? ""
  return `${first} ${last}`.trim() || "Customer"
}

export async function uploadVendorImages(files: FileList | File[]) {
  const urls: string[] = []

  for (const file of Array.from(files)) {
    const signed = await sdk.client.fetch<{
      key: string
      upload_url: string
      public_url: string | null
    }>("/vendor/uploads/sign", {
      method: "POST",
      body: {
        filename: file.name,
        content_type: file.type,
        size: file.size,
        scope: "catalog",
      },
    })

    const response = await fetch(signed.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    })

    if (!response.ok || !signed.public_url) {
      throw new Error(`Upload failed for ${file.name}`)
    }

    urls.push(signed.public_url)
  }

  return urls
}

export async function uploadVendorPhotos(files: FileList | File[], scope: "catalog" | "private") {
  const keys: string[] = []

  for (const file of Array.from(files)) {
    const signed = await sdk.client.fetch<{
      key: string
      upload_url: string
      public_url: string | null
    }>("/vendor/uploads/sign", {
      method: "POST",
      body: {
        filename: file.name,
        content_type: file.type,
        size: file.size,
        scope,
      },
    })

    const response = await fetch(signed.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    })

    if (!response.ok) {
      throw new Error(`Upload failed for ${file.name}`)
    }

    keys.push(signed.key)
  }

  return keys
}
