import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { buttonStyles } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Vendor portal",
}

export default function VendorPage() {
  return (
    <main>
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-dhundla">For boutiques and individual listers</p>
          <h1 className="mt-2 font-display text-4xl text-shahtoot sm:text-5xl">
            Your calendar, finally online.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-dhundla">
            List each physical piece once, see exactly which dates it is booked, hand it over,
            record the return, and file an inspection with photos. The vendor portal is being
            built now.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className={buttonStyles({ variant: "secondary" })}>
              Back to the storefront
            </Link>
            <Link href="/vendor/register" className={buttonStyles()}>
              Register a boutique
            </Link>
            <Link href="/vendor/today" className={buttonStyles({ variant: "ghost" })}>
              Open the vendor portal
            </Link>
          </div>
        </div>
      </Container>
    </main>
  )
}
