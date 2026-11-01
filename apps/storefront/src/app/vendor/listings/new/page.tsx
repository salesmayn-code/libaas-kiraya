"use client"

import { VendorListingForm } from "@/components/vendor-listing-form"
import { VendorShell } from "@/components/vendor-shell"

export default function NewVendorListingPage() {
  return (
    <VendorShell
      title="New listing"
      subtitle="Photos, pricing, measurements and the physical units you actually own."
    >
      <VendorListingForm />
    </VendorShell>
  )
}
