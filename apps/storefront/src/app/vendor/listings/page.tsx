"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { VendorShell } from "@/components/vendor-shell"
import { Button } from "@/components/ui/button"
import { formatPKR } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"
import type { VendorListing } from "@/lib/vendor"

export default function VendorListingsPage() {
  const [listings, setListings] = useState<VendorListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const result = await sdk.client.fetch<{ listings: VendorListing[] }>("/vendor/listings?limit=50")
      setListings(result.listings)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  async function publish(id: string) {
    setError(null)
    try {
      await sdk.client.fetch(`/vendor/listings/${id}/publish`, { method: "POST" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish")
    }
  }

  return (
    <VendorShell
      title="Listings"
      subtitle="Each listing is a product with rental rules, sizes and physical units."
    >
      <div className="mb-4 flex justify-end">
        <Link href="/vendor/listings/new" className="text-sm font-medium text-shahtoot underline">
          New listing
        </Link>
      </div>
      {error ? <p className="mb-4 text-sm text-khatra">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-dhundla">Loading listings…</p>
      ) : listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <article key={listing.id} className="rounded-control border border-lakeer bg-surface p-4">
              <div className="flex gap-3">
                <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-image bg-sang">
                  {listing.product?.thumbnail ? (
                    <Image
                      src={listing.product.thumbnail}
                      alt={listing.product.title ?? "Listing"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-xs capitalize text-dhundla">{listing.status}</p>
                  <h2 className="text-sm font-semibold text-syahi">
                    {listing.product?.title ?? "Untitled"}
                  </h2>
                  <p className="mt-1 text-xs text-dhundla">
                    {listing.city} · {formatPKR(listing.base_amount)}
                  </p>
                  <p className="text-xs text-dhundla">
                    {listing.variants?.length ?? 0} sizes · {listing.units?.length ?? 0} units
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                {listing.status !== "active" ? (
                  <Button size="sm" onClick={() => publish(listing.id)}>
                    Publish
                  </Button>
                ) : (
                  <p className="text-xs text-mor">Live and searchable</p>
                )}
                <Link
                  href={`/vendor/listings/${listing.id}/edit`}
                  className="text-xs font-medium text-shahtoot underline"
                >
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
          <p className="font-medium text-syahi">No listings yet</p>
          <p className="mt-1 text-sm text-dhundla">
            Add photos, sizes, measurements and the physical units you own.
          </p>
          <Link href="/vendor/listings/new">
            <Button className="mt-4">Create your first listing</Button>
          </Link>
        </div>
      )}
    </VendorShell>
  )
}
