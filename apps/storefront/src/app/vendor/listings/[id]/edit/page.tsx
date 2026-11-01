"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { VendorListingForm, type VendorListingDetail } from "@/components/vendor-listing-form"
import { VendorShell } from "@/components/vendor-shell"
import { sdk } from "@/lib/sdk"

export default function EditVendorListingPage() {
  const params = useParams<{ id: string }>()
  const [listing, setListing] = useState<VendorListingDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    sdk.client
      .fetch<{ listing: VendorListingDetail }>(`/vendor/listings/${params.id}`)
      .then((result) => setListing(result.listing))
      .catch(() => setError("Could not load this listing."))
  }, [params.id])

  return (
    <VendorShell title="Edit listing" subtitle="Update photos, pricing and rental rules.">
      {error ? <p className="text-sm text-khatra">{error}</p> : null}
      {!listing && !error ? <p className="text-sm text-dhundla">Loading listing…</p> : null}
      {listing ? <VendorListingForm listing={listing} /> : null}
    </VendorShell>
  )
}
