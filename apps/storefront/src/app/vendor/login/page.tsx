import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { VendorLoginForm } from "@/components/vendor-auth-forms"

export const metadata: Metadata = { title: "Vendor sign in" }

export default function VendorLoginPage() {
  return (
    <main>
      <Container className="py-14">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-4xl text-shahtoot">Vendor sign in</h1>
          <p className="mt-2 text-sm text-dhundla">
            Manage handovers, returns, inspections and payouts.
          </p>
          <div className="mt-8 rounded-control border border-lakeer bg-surface p-6">
            <VendorLoginForm />
          </div>
          <p className="mt-4 text-sm text-dhundla">
            New boutique?{" "}
            <Link href="/vendor/register" className="font-medium text-shahtoot hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </Container>
    </main>
  )
}
