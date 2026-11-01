import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { VendorRegisterForm } from "@/components/vendor-auth-forms"

export const metadata: Metadata = { title: "Register a boutique" }

export default function VendorRegisterPage() {
  return (
    <main>
      <Container className="py-14">
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-4xl text-shahtoot">Register a boutique</h1>
          <p className="mt-2 text-sm text-dhundla">
            Tell us who you are. An admin approves new boutiques before listings go live.
          </p>
          <div className="mt-8 rounded-control border border-lakeer bg-surface p-6">
            <VendorRegisterForm />
          </div>
          <p className="mt-4 text-sm text-dhundla">
            Already registered?{" "}
            <Link href="/vendor/login" className="font-medium text-shahtoot hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </main>
  )
}
